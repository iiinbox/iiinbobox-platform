import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { OrderSummary } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatPrice } from "../../lib/format";

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { items } = await api.orders.list();
    setOrders(items);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Log in to view your orders.</Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/order/${item.id}`)}>
          <View>
            <Text style={styles.title}>#{item.orderNumber}</Text>
            <Text style={styles.sub}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text>{formatPrice(item.totalAmountMinor, item.currency)}</Text>
            <Text style={styles.sub}>{item.status}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: { fontWeight: "600" },
  sub: { color: "#666", fontSize: 12 },
});
