import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { OrderSummary } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { formatPrice } from "../../lib/format";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    api.orders.get(id).then(setOrder);
  }, [id]);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>#{order.orderNumber}</Text>
      <Text style={styles.status}>Status: {order.status}</Text>
      <Text style={styles.total}>Total: {formatPrice(order.totalAmountMinor, order.currency)}</Text>
      <FlatList
        data={order.subOrders}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <View style={styles.subOrder}>
            <Text style={styles.vendor}>{item.vendor?.storeName}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            {item.items.map((i) => (
              <Text key={i.id} style={styles.item}>
                {i.titleSnapshot} × {i.quantity} — {formatPrice(i.priceMinorSnap * i.quantity, order.currency)}
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  status: { color: "#666", marginTop: 4 },
  total: { fontWeight: "600", marginTop: 8, marginBottom: 12 },
  subOrder: { borderWidth: 1, borderColor: "#eee", borderRadius: 4, padding: 12, marginBottom: 8 },
  vendor: { fontWeight: "600" },
  item: { color: "#444", marginTop: 4 },
});
