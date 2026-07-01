import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from = process.env.SMTP_FROM ?? "no-reply@yourdomain.com";

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      this.transporter = null;
      this.logger.warn("SMTP_HOST not configured — transactional emails are disabled");
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[EMAIL SKIPPED] to=${to} subject="${subject}"`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendVendorApproved(email: string, storeName: string) {
    return this.send(
      email,
      "Your vendor application was approved!",
      `<p>Congratulations! Your store <strong>${storeName}</strong> has been approved on iiiiiBOX. You can now add products and start selling.</p>`,
    );
  }

  async sendVendorRejected(email: string, storeName: string, reason: string) {
    return this.send(
      email,
      "Your vendor application was not approved",
      `<p>Your application for <strong>${storeName}</strong> was not approved. Reason: ${reason}</p>`,
    );
  }

  async sendOrderConfirmation(email: string, orderNumber: string, totalAmountMinor: number, currency: string) {
    const total = new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(totalAmountMinor / 100);
    return this.send(
      email,
      `Order confirmed — #${orderNumber}`,
      `<p>Thank you for your order! Your order <strong>#${orderNumber}</strong> totalling <strong>${total}</strong> has been confirmed and is being processed.</p>`,
    );
  }
}
