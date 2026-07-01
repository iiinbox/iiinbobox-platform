import { Stack } from "expo-router";
import { AuthProvider } from "../lib/auth-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ title: "Product" }} />
        <Stack.Screen name="store/[vendorSlug]" options={{ title: "Store" }} />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="login" options={{ title: "Log in" }} />
        <Stack.Screen name="register" options={{ title: "Register" }} />
        <Stack.Screen name="order/[id]" options={{ title: "Order" }} />
      </Stack>
    </AuthProvider>
  );
}
