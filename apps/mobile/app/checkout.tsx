import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { Address } from "@iiiiibox/shared-types";
import { ApiError } from "@iiiiibox/api-client";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export default function CheckoutScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.addresses.listMine().then((list) => {
      setAddresses(list);
      setSelected(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
    });
  }, [user]);

  async function saveAddress() {
    const address = await api.addresses.create({ line1, city, state, pincode, phone, country: "IN", isDefault: true });
    setAddresses((prev) => [address, ...prev]);
    setSelected(address.id);
  }

  async function pay() {
    if (!selected) {
      setError("Select or add a delivery address");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await api.checkout.create({ addressId: selected });
      // No native Razorpay widget wired up yet (react-native-razorpay needs a custom
      // dev client, not Expo Go). When session.razorpayKeyId is empty the server is
      // in stub mode anyway, so this mirrors the web app's dev/test fallback path.
      const order = await api.checkout.verify({ orderId: session.orderId });
      router.replace(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Log in to checkout.</Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Delivery address</Text>
      {addresses.map((address) => (
        <Text
          key={address.id}
          style={[styles.addressOption, selected === address.id && styles.addressSelected]}
          onPress={() => setSelected(address.id)}
        >
          {address.line1}, {address.city}, {address.state} {address.pincode}
        </Text>
      ))}

      <Text style={styles.heading}>Add a new address</Text>
      <TextInput style={styles.input} placeholder="Address line" value={line1} onChangeText={setLine1} />
      <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />
      <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} />
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} />
      <Button title="Save address" onPress={saveAddress} />

      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={submitting ? "Processing..." : "Pay now"} onPress={pay} disabled={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  heading: { fontWeight: "700", marginTop: 12 },
  addressOption: { borderWidth: 1, borderColor: "#ccc", borderRadius: 4, padding: 10, marginTop: 6 },
  addressSelected: { borderColor: "#000", backgroundColor: "#f5f5f5" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 4, padding: 10 },
  error: { color: "red" },
});
