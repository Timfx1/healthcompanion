import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { spacing, typography } from "../theme";

export function SplashScreen() {
  return (
    <LinearGradient colors={["#2F7DE1", "#1D5FB5"]} style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="pulse" size={56} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>Healthcompanion</Text>
      <Text style={styles.tagline}>Your recovery companion</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  iconWrap: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl
  },
  title: {
    ...typography.display,
    color: "#FFFFFF",
    marginBottom: spacing.sm
  },
  tagline: {
    ...typography.body,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center"
  }
});
