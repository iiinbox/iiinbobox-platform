import { Module } from "@nestjs/common";
import { RazorpayModule } from "../razorpay/razorpay.module";
import { CheckoutModule } from "../checkout/checkout.module";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [RazorpayModule, CheckoutModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
