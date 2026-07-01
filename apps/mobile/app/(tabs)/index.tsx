import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import type { ProductWithVendor } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard";

export default function HomeScreen() {
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { items } = await api.products.search({});
    setProducts(items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
});
