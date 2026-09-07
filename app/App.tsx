import { useEffect, useRef } from "react";
import "react-native-gesture-handler";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { SplashScreen } from "./src/screens/SplashScreen";
import { AppThemeProvider, useAppTheme } from "./src/state/AppThemeContext";
import { AppDataProvider } from "./src/state/AppDataContext";
// The Recovery Companion store, on AsyncStorage (§7 Phase 1). Kept alongside
// AppDataContext rather than merged into it: the two describe different
// products, and mixing them would make removing the AnklePath domain
// impossible to review as its own change.
import { RecoveryDataProvider } from "./src/state/RecoveryDataContext";
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
                <OnboardingProvider>
                {/* Outside the Recovery store on purpose. It reads AnklePath's
                    entitlement and renders nothing, so gating it behind a
                    different store's hydration would delay the billing sync for
                    no reason at all. */}
                <PremiumSync />
                {/* The splash is the fallback because it is what the app was
                    already showing at that moment: `RootNavigator` holds it for
                    a minimum of two seconds. Before this, that timer was the
                    only thing keeping Home from painting "0 check-ins" over
                    somebody's real recovery — a race this store could lose on a
                    cold device, since its hydrate is eight reads to
                    AppDataContext's one. Now the wait is stated instead of
                    raced, and it looks identical. */}
                <RecoveryDataProvider fallback={<SplashScreen />}>
                  <ThemedAppShell />
                </RecoveryDataProvider>
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
      <Text style={styles.errorText}>Please close and reopen Recovery Health Companion. The error has been reported.</Text>
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
