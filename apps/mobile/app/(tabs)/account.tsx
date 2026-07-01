import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../lib/auth-context";

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>You&apos;re not logged in</Text>
        <Button title="Log in" onPress={() => router.push("/login")} />
        <Button title="Register" onPress={() => router.push("/register")} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{user.email}</Text>
      <Text style={styles.sub}>{user.role}</Text>
      <Button title="Log out" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  title: { fontSize: 18, fontWeight: "600" },
  sub: { color: "#666" },
});
