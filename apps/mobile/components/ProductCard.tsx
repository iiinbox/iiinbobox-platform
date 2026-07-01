import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { ProductWithVendor } from "@iiiiibox/shared-types";
import { formatPrice } from "../lib/format";

export function ProductCard({ product }: { product: ProductWithVendor }) {
  const router = useRouter();
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/product/${product.slug}`)}>
      {product.images[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {product.title}
      </Text>
      <Text style={styles.vendor}>{product.vendor.storeName}</Text>
      <Text style={styles.price}>{formatPrice(product.priceMinor, product.currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 4 },
  image: { width: "100%", height: 100, marginBottom: 6, borderRadius: 4 },
  placeholder: { backgroundColor: "#eee" },
  title: { fontWeight: "600" },
  vendor: { color: "#666", fontSize: 12 },
  price: { marginTop: 4, fontWeight: "500" },
});
