import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import type { Cart } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatPrice } from "../../lib/format";

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setCart(await api.cart.get());
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Log in to view your cart.</Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
      </View>
    );
  }

  if (!cart) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const total = cart.items.reduce((sum, item) => sum + item.product.priceMinor * item.quantity, 0);

  async function updateQty(productId: string, quantity: number) {
    setCart(await api.cart.updateItem(productId, { quantity }));
  }

  async function remove(productId: string) {
    setCart(await api.cart.removeItem(productId));
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.product.title}</Text>
              <Text style={styles.vendor}>{item.product.vendor.storeName}</Text>
              <Text>{formatPrice(item.product.priceMinor, item.product.currency)}</Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              defaultValue={String(item.quantity)}
              onEndEditing={(e) => updateQty(item.productId, Number(e.nativeEvent.text) || 1)}
            />
            <Button title="Remove" onPress={() => remove(item.productId)} />
          </View>
        )}
      />
      {cart.items.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.total}>Total: {formatPrice(total, cart.items[0].product.currency)}</Text>
          <Button title="Checkout" onPress={() => router.push("/checkout")} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 8,
  },
  title: { fontWeight: "600" },
  vendor: { color: "#666", fontSize: 12 },
  qtyInput: { borderWidth: 1, borderColor: "#ccc", width: 50, textAlign: "center", padding: 4 },
  footer: { padding: 16, borderTopWidth: 1, borderColor: "#eee", gap: 8 },
  total: { fontWeight: "700", fontSize: 16 },
});
