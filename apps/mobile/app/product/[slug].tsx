import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ProductWithVendor } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { formatPrice } from "../../lib/format";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithVendor | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.products.bySlug(slug).then(setProduct);
  }, [slug]);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  async function addToCart() {
    if (!user) {
      router.push("/login");
      return;
    }
    setAdding(true);
    await api.cart.addItem({ productId: product!.id, quantity: 1 });
    setAdding(false);
    setAdded(true);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.images[0] ? (
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.vendor} onPress={() => router.push(`/store/${product.vendor.storeSlug}`)}>
        {product.vendor.storeName}
      </Text>
      <Text style={styles.price}>{formatPrice(product.priceMinor, product.currency)}</Text>
      <Text style={styles.stock}>
        {product.stockQty > 0 ? `${product.stockQty} in stock` : "Out of stock"}
      </Text>
      {product.description && <Text style={styles.description}>{product.description}</Text>}
      {product.stockQty > 0 && (
        <Button
          title={added ? "Added to cart" : adding ? "Adding..." : "Add to cart"}
          onPress={addToCart}
          disabled={adding}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 240, borderRadius: 4, marginBottom: 12 },
  placeholder: { backgroundColor: "#eee" },
  title: { fontSize: 18, fontWeight: "700" },
  vendor: { color: "#2563eb", marginTop: 4 },
  price: { fontSize: 16, marginTop: 8 },
  stock: { color: "#666", marginTop: 4 },
  description: { marginTop: 12, marginBottom: 16 },
});
