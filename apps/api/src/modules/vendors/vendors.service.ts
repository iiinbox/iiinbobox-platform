import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { prisma, VendorStatus } from "@iiiiibox/database";
import { UserRole, type VendorApplyInput } from "@iiiiibox/shared-types";
import type { RequestUser } from "../../common/types/request-user";
import { MailService } from "../mail/mail.service";
import { RazorpayLinkedAccountService } from "./razorpay-linked-account.service";

const ACCESS_TOKEN_TTL = "15m";

@Injectable()
export class VendorsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly razorpay: RazorpayLinkedAccountService,
    private readonly mail: MailService,
  ) {}

  async apply(currentUser: RequestUser, input: VendorApplyInput) {
    const existingVendor = await prisma.vendor.findUnique({ where: { userId: currentUser.userId } });
    if (existingVendor) {
      throw new ConflictException("You have already applied as a vendor");
    }
    const slugTaken = await prisma.vendor.findUnique({ where: { storeSlug: input.storeSlug } });
    if (slugTaken) {
      throw new ConflictException("Store slug already in use");
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: currentUser.userId,
        storeName: input.storeName,
        storeSlug: input.storeSlug,
        storeDescription: input.storeDescription,
        status: VendorStatus.PENDING,
      },
    });
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { role: UserRole.VENDOR },
    });

    const accessToken = this.jwtService.sign(
      { userId: currentUser.userId, email: currentUser.email, role: UserRole.VENDOR, vendorId: vendor.id },
      { secret: process.env.JWT_SECRET ?? "change-me", expiresIn: ACCESS_TOKEN_TTL },
    );

    return { vendor, accessToken };
  }

  async findMine(currentUser: RequestUser) {
    const vendor = await prisma.vendor.findUnique({ where: { userId: currentUser.userId } });
    if (!vendor) {
      throw new NotFoundException("No vendor profile found");
    }
    return vendor;
  }

  async findBySlug(slug: string) {
    const vendor = await prisma.vendor.findUnique({ where: { storeSlug: slug } });
    if (!vendor || vendor.status !== VendorStatus.APPROVED) {
      throw new NotFoundException("Vendor not found");
    }
    return vendor;
  }

  async listForAdmin(status?: VendorStatus) {
    return prisma.vendor.findMany({
      where: status ? { status } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async approve(vendorId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    if (vendor.status !== VendorStatus.PENDING) {
      throw new ForbiddenException("Only pending vendors can be approved");
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: vendor.userId } });
    const { accountId: razorpayAccountId, status: razorpayAccountStatus } =
      await this.razorpay.createLinkedAccount({ storeName: vendor.storeName, email: user.email });

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: VendorStatus.APPROVED, razorpayAccountId, razorpayAccountStatus, rejectionReason: null },
    });
    void this.mail.sendVendorApproved(user.email, vendor.storeName);
    return updated;
  }

  async reject(vendorId: string, rejectionReason: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: vendor.userId } });
    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { status: VendorStatus.REJECTED, rejectionReason },
    });
    void this.mail.sendVendorRejected(user.email, vendor.storeName, rejectionReason);
    return updated;
  }
}
