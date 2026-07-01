import { getServerApiClient } from "@/lib/server-api";
import { Separator } from "@/components/ui/separator";
import { CheckoutForm } from "./checkout-form";
import { AddressForm } from "./address-form";

export default async function CheckoutPage() {
  const addresses = await getServerApiClient().addresses.listMine();

  return (
    <div className="container max-w-xl py-12">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="space-y-8">
        <section>
          <h2 className="font-semibold mb-4">Delivery address</h2>
          <CheckoutForm addresses={addresses} />
        </section>

        <Separator />

        <section>
          <h2 className="font-semibold mb-4">Add a new address</h2>
          <AddressForm />
        </section>
      </div>
    </div>
  );
}
