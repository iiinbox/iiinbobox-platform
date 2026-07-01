import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MailModule } from "../mail/mail.module";
import { VendorsController } from "./vendors.controller";
import { AdminVendorsController } from "./admin-vendors.controller";
import { AnalyticsController } from "./analytics.controller";
import { VendorsService } from "./vendors.service";
import { RazorpayLinkedAccountService } from "./razorpay-linked-account.service";
import { AnalyticsService } from "./analytics.service";

@Module({
  imports: [JwtModule.register({}), MailModule],
  controllers: [VendorsController, AdminVendorsController, AnalyticsController],
  providers: [VendorsService, RazorpayLinkedAccountService, AnalyticsService],
})
export class VendorsModule {}
