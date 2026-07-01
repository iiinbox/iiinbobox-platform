import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import type { ProductWithVendor } from "@iiiiibox/shared-types";
import { api } from "../../lib/api";
import { ProductCard } from "../../components/ProductCard";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductWithVendor[]>([]);
  const [searched, setSearched] = useState(false);

  async function onSubmit() {
    const { items } = await api.products.search({ search: query });
    setProducts(items);
    setSearched(true);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search products..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={searched ? <Text style={styles.empty}>No results.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 4, padding: 10, marginBottom: 8 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
});
