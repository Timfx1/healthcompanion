import { useEffect, useRef } from "react";
import "react-native-gesture-handler";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { AppThemeProvider, useAppTheme } from "./src/state/AppThemeContext";
import { AppDataProvider } from "./src/state/AppDataContext";
import { ConsentProvider } from "./src/state/ConsentContext";
import { OnboardingProvider } from "./src/state/OnboardingContext";
import { PremiumSync } from "./src/components/PremiumSync";
import { AnalyticsProvider } from "./src/services/analytics/AnalyticsProvider";
import { AnalyticsEvents } from "./src/services/analytics/events";
import { trackEvent, trackScreen } from "./src/services/analytics/posthog";
import { initSentry, Sentry } from "./src/services/monitoring/sentry";

initSentry();

const navigationRef = createNavigationContainerRef();

function ThemedAppShell() {
  const { palette, isDark, tokens } = useAppTheme();
  const routeNameRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    trackEvent(AnalyticsEvents.appOpened);
    trackEvent(AnalyticsEvents.sessionStarted);
  }, []);

  const navTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: tokens.color.accent.default
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
        if (routeNameRef.current) trackScreen(routeNameRef.current);
      }}
      onStateChange={() => {
        const currentRouteName = navigationRef.getCurrentRoute()?.name;
        if (currentRouteName && routeNameRef.current !== currentRouteName) {
          routeNameRef.current = currentRouteName;
          trackScreen(currentRouteName);
        }
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<RootErrorFallback />}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <ConsentProvider>
            <AnalyticsProvider>
              <AppDataProvider>
                <PremiumSync />
                <OnboardingProvider>
                  <ThemedAppShell />
                </OnboardingProvider>
              </AppDataProvider>
            </AnalyticsProvider>
          </ConsentProvider>
        </AppThemeProvider>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
}

export default Sentry.wrap(App);

function RootErrorFallback() {
  return (
    <View style={styles.errorFallback}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>Please close and reopen AnklePath. The error has been reported.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F4F8FC"
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center"
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    color: "#566475",
    textAlign: "center"
  }
});
