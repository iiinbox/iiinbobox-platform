import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { prisma } from "@iiiiibox/database";
import type { LoginInput, RegisterInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";
import { RedisService } from "../redis/redis.service";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const SESSION_KEY = (sessionId: string) => `session:${sessionId}`;

interface RefreshPayload {
  userId: string;
  sessionId?: string; // absent on refresh tokens issued before this change
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  // Sessions live in Redis (item 2) so login survives an API restart the same
  // way it always did (JWTs are self-verifying either way) — the actual new
  // capability is server-side revocation: logout now deletes the session
  // record, so a captured/old refresh token stops working immediately instead
  // of silently remaining valid for its full 30-day lifetime. If Redis is
  // unreachable, session tracking is skipped entirely and the app falls back
  // to trusting the JWT signature alone — never blocks login (item 5).
  //
  // issueTokens signs a token pair for an EXISTING sessionId — refresh() uses
  // this to extend the same session rather than minting a new one every 15
  // minutes, which would otherwise leave a trail of orphaned-but-still-valid
  // session records behind on every refresh.
  private issueTokens(user: RequestUser, sessionId: string) {
    const accessToken = this.jwtService.sign(user, {
      secret: process.env.JWT_SECRET ?? "change-me",
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(
      { userId: user.userId, sessionId } satisfies RefreshPayload,
      {
        secret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );
    return { accessToken, refreshToken };
  }

  // login()/register() only: creates a brand new session.
  private async signTokens(user: RequestUser) {
    const sessionId = randomUUID();
    await this.redis.set(SESSION_KEY(sessionId), { userId: user.userId, createdAt: new Date().toISOString() }, REFRESH_TOKEN_TTL_SECONDS);
    return this.issueTokens(user, sessionId);
  }

  private async toRequestUser(userId: string): Promise<RequestUser> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { vendor: true },
    });
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendor?.id,
    };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException("Email already in use");
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });
    return this.signTokens(await this.toRequestUser(user.id));
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.signTokens(await this.toRequestUser(user.id));
  }

  async refresh(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.toRequestUser(payload.userId);

    // Revocation check — only enforced when Redis is actually reachable.
    // `exists()` returning false could mean either "genuinely revoked" or
    // "Redis is down, couldn't check" — isConnected disambiguates so an
    // outage degrades to "trust the JWT" rather than locking everyone out.
    if (payload.sessionId && this.redis.isConnected) {
      const alive = await this.redis.exists(SESSION_KEY(payload.sessionId));
      if (!alive) {
        throw new UnauthorizedException("Session revoked or expired");
      }
      // Sliding expiry: an active session keeps extending rather than dying
      // exactly 30 days after login regardless of ongoing use. Reuses the
      // SAME sessionId (via issueTokens) rather than minting a new one, so
      // routine token refreshes don't leave orphaned session records behind.
      await this.redis.expire(SESSION_KEY(payload.sessionId), REFRESH_TOKEN_TTL_SECONDS);
      return this.issueTokens(user, payload.sessionId);
    }

    // No sessionId (refresh token issued before this change) or Redis
    // unreachable — fall back to the original "always mint a new session"
    // behavior, which is still correct, just without revocation history.
    return this.signTokens(user);
  }

  // New (item 2's "more reliable login state"): actually invalidates the
  // session server-side. Decodes rather than verifies — logout should still
  // work to clean up a session even if the refresh token happens to have
  // just expired, and there's no security concern in honoring that.
  async logout(refreshToken: string): Promise<void> {
    const payload = this.jwtService.decode(refreshToken) as RefreshPayload | null;
    if (payload?.sessionId) {
      await this.redis.del(SESSION_KEY(payload.sessionId));
    }
  }

  async me(userId: string) {
    return this.toRequestUser(userId);
  }
}
