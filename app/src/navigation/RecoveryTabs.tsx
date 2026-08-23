// ============================================================
// FILE: RecoveryTabs.tsx — the five Recovery Companion tabs.
//
// Spec §5: `Home · Timeline · Check-in (center, prominent) · Progress · Profile`
//
// This replaces AnklePath's `Home · Plan · Track · Learn · Profile`. The old
// decomposition is a good one for a rehab PROGRAMME — a plan you follow and
// trackers you fill in — and it is not this product. Recovery Companion's
// subject is a journey with a timeline running through it, and the centre tab
// is a ten-second action rather than a section.
//
// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN IS CENTRE, AND IT IS NOT A TAB
//
// §5 says "centre, prominent", and P3 puts the fast path at ≤10 seconds
// one-handed. So the centre item opens the check-in as a MODAL rather than
// switching to a fourth screen: switching tabs loses whatever the person was
// looking at, and a check-in is something you do and then return from, not a
// place you go. It is also the largest touch target in the bar, sitting in the
// thumb zone.
//
// The order is deliberate too. Home and Timeline are on the left because they
// are what a returning user reaches for; Progress and Profile are on the right
// because they are read occasionally rather than daily.
// ============================================================

import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../state/AppThemeContext";
import { useRecoveryData } from "../state/RecoveryDataContext";
import { scale } from "../theme/tokens.generated";
import { RecoveryHomeScreen } from "../screens/recovery/HomeScreen";
import { RecoveryTimelineScreen } from "../screens/recovery/TimelineScreen";
import { RecoveryCheckInScreen } from "../screens/recovery/CheckInScreen";
import { RecoveryProgressScreen } from "../screens/recovery/ProgressScreen";
import { RecoveryProfileScreen } from "../screens/recovery/ProfileScreen";
import type { MainStackParamList, RecoveryTabsParamList } from "./types";

const Tab = createBottomTabNavigator<RecoveryTabsParamList>();

type Nav = NativeStackNavigationProp<MainStackParamList>;

const ICONS: Record<keyof RecoveryTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Timeline: "list-outline",
  Progress: "trending-up-outline",
  Profile: "person-outline",
};

export function RecoveryTabs() {
  const { tokens } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const { appointments, medications, milestones } = useRecoveryData();
  const [checkInOpen, setCheckInOpen] = useState(false);

  // The soonest appointment, falling back to the most recent one. Resolving it
  // HERE rather than inside the screens keeps every detail screen ignorant of
  // the navigator — see detail/routes.tsx.
  const nextAppointmentId =
    (appointments.filter((a) => new Date(a.date).getTime() > Date.now())
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? appointments[0])?.id ?? "";

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tokens.color.surface.raised,
            borderTopColor: tokens.color.surface.border,
            // The bar leaves a gap in the middle for the centre action, which
            // floats above it rather than living inside it.
            paddingTop: scale.space[2],
            paddingBottom: scale.space[3],
            minHeight: scale.size.buttonPrimary + scale.space[5],
          },
          tabBarActiveTintColor: tokens.color.accent.strong,
          tabBarInactiveTintColor: tokens.color.text.secondary,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home">
          {() => (
            <RecoveryHomeScreen
              onOpenCheckIn={() => setCheckInOpen(true)}
              onOpenReport={() => navigation.navigate("RcReport")}
              onOpenWeekly={() => navigation.navigate("RcWeekly")}
              onOpenAppointment={() => navigation.navigate("RcAppointment", { appointmentId: nextAppointmentId })}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Timeline">
          {() => (
            <RecoveryTimelineScreen
              onAdd={() => navigation.navigate("RcAddEntry")}
              onOpenEntry={(entry) => {
                // The timeline routes by ENTRY TYPE. A row that opened nothing
                // would be the timeline claiming to be the product's heart while
                // being a read-only list.
                if (entry.type === "journal") navigation.navigate("RcJournal", { entryId: entry.id });
                else if (entry.type === "milestone") {
                  const m = milestones.find((x) => x.title === entry.title);
                  if (m) navigation.navigate("RcMilestone", { milestoneId: m.id });
                } else if (entry.type === "medication") {
                  const first = medications[0];
                  if (first) navigation.navigate("RcMedication", { medicationId: first.id });
                } else if (entry.type === "appointment") {
                  const first = appointments[0];
                  if (first) navigation.navigate("RcAppointment", { appointmentId: first.id });
                } else if (entry.type === "photo") navigation.navigate("RcPhotoCompare");
                else if (entry.type === "reflection") navigation.navigate("RcWeekly");
              }}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Progress">
          {() => <RecoveryProgressScreen onUnlock={() => navigation.navigate("PremiumTeaser")} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => (
            <RecoveryProfileScreen
              onOpenMedications={() => { const m = medications[0]; if (m) navigation.navigate("RcMedication", { medicationId: m.id }); }}
              onOpenAppointments={() => navigation.navigate("RcAppointment", { appointmentId: nextAppointmentId })}
              onOpenEducation={() => navigation.navigate("RcArticle", { articleId: "is-this-normal-week-6" })}
              onOpenSafety={() => navigation.navigate("RcSafety")}
              onOpenReport={() => navigation.navigate("RcReport")}
              onOpenPremium={() => navigation.navigate("PremiumTeaser")}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* THE CENTRE ACTION. Largest target in the bar, in the thumb zone, and
          it opens rather than navigates. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Check in"
        onPress={() => setCheckInOpen(true)}
        style={{
          position: "absolute",
          alignSelf: "center",
          bottom: scale.space[5],
          width: scale.size.buttonPrimary,
          height: scale.size.buttonPrimary,
          borderRadius: scale.radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tokens.color.cta.from,
          borderWidth: scale.size.hairlineThick,
          borderColor: tokens.color.surface.raised,
        }}
      >
        <Ionicons name="add" size={scale.size.badge} color={tokens.color.cta.label} />
      </Pressable>

      <Modal
        visible={checkInOpen}
        animationType="slide"
        onRequestClose={() => setCheckInOpen(false)}
        presentationStyle="pageSheet"
      >
        <RecoveryCheckInScreen onDone={() => setCheckInOpen(false)} />
      </Modal>
    </View>
  );
}
