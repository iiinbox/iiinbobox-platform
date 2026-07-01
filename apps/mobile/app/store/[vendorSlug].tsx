import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { ProductWithVendor, Vendor } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard";

export default function StoreScreen() {
  const { vendorSlug } = useLocalSearchParams<{ vendorSlug: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<ProductWithVendor[]>([]);

  useEffect(() => {
    api.vendors.bySlug(vendorSlug).then(setVendor);
    api.products.search({ vendor: vendorSlug }).then((r) => setProducts(r.items));
  }, [vendorSlug]);

  return (
    <View style={styles.container}>
      {vendor && (
        <View style={styles.header}>
          <Text style={styles.title}>{vendor.storeName}</Text>
          {vendor.storeDescription && <Text style={styles.description}>{vendor.storeDescription}</Text>}
        </View>
      )}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700" },
  description: { color: "#666", marginTop: 4 },
});
