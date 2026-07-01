import { Module } from "@nestjs/common";
import { AddressesModule } from "../addresses/addresses.module";
import { RazorpayModule } from "../razorpay/razorpay.module";
import { MailModule } from "../mail/mail.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [AddressesModule, RazorpayModule, MailModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
