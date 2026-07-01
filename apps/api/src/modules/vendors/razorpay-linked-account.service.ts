import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";

interface RazorpayAccountResponse {
  id: string;
  entity: string;
  email: string;
  status: string;
  legal_business_name: string;
}

@Injectable()
export class RazorpayLinkedAccountService {
  private readonly logger = new Logger(RazorpayLinkedAccountService.name);
  private readonly baseUrl = "https://api.razorpay.com/v2";

  private get credentials() {
    return {
      keyId: process.env.RAZORPAY_KEY_ID ?? "",
      keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    };
  }

  private get isConfigured() {
    const { keyId, keySecret } = this.credentials;
    return keyId.startsWith("rzp_") && keySecret.length > 0;
  }

  async createLinkedAccount(input: { storeName: string; email: string }): Promise<{ accountId: string; status: string }> {
    if (!this.isConfigured) {
      const stubId = `acc_stub_${Date.now()}`;
      this.logger.warn(
        `Razorpay keys not configured — stubbing linked account ${stubId} for ${input.storeName}`,
      );
      return { accountId: stubId, status: "stub" };
    }

    const { keyId, keySecret } = this.credentials;
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const body = {
      email: input.email,
      legal_business_name: input.storeName,
      business_type: "individual",
      type: "route",
      profile: {
        category: "others",
        subcategory: "all",
        addresses: {
          registered: {
            street1: "iiinbox seller",
            city: "Mumbai",
            state: "Maharashtra",
            postal_code: 400001,
            country: "IN",
          },
        },
      },
    };

    const res = await fetch(`${this.baseUrl}/accounts`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      this.logger.error(
        `Razorpay linked account creation failed for ${input.storeName}: ${error}`,
      );
      throw new InternalServerErrorException(
        `Could not create Razorpay linked account: ${res.statusText}`,
      );
    }

    const data = (await res.json()) as RazorpayAccountResponse;
    this.logger.log(
      `Created Razorpay linked account ${data.id} (status: ${data.status}) for ${input.storeName}`,
    );

    return { accountId: data.id, status: data.status };
  }
}
