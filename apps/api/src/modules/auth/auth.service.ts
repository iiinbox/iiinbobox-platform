import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { prisma } from "@iiiiibox/database";
import type { LoginInput, RegisterInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  private signTokens(user: RequestUser) {
    const accessToken = this.jwtService.sign(user, {
      secret: process.env.JWT_SECRET ?? "change-me",
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(
      { userId: user.userId },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
        expiresIn: REFRESH_TOKEN_TTL,
      },
    );
    return { accessToken, refreshToken };
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
    let payload: { userId: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    return this.signTokens(await this.toRequestUser(payload.userId));
  }

  async me(userId: string) {
    return this.toRequestUser(userId);
  }
}
