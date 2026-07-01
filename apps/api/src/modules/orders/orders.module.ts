import { Module } from "@nestjs/common";
import { RazorpayModule } from "../razorpay/razorpay.module";
import { OrdersController } from "./orders.controller";
import { VendorOrdersController } from "./vendor-orders.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { RefundController } from "./refund.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [RazorpayModule],
  controllers: [OrdersController, VendorOrdersController, AdminOrdersController, RefundController],
  providers: [OrdersService],
})
export class OrdersModule {}
