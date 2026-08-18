import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppButton } from "../../components/AppButton";
import { OptionCard } from "../../components/OptionCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { symptomOptions } from "../../data/onboardingOptions";
import { useAppData } from "../../state/AppDataContext";
import { useAppTheme } from "../../state/AppThemeContext";
import { getCurrentUser, signInAsGuest } from "../../services/firebase/auth";
import { savePainLog } from "../../services/firebase/firestore";
import { AnalyticsEvents } from "../../services/analytics/events";
import { trackEvent } from "../../services/analytics/posthog";
import { spacing, typography } from "../../theme";

const painLocations = ["Outside ankle", "Inside ankle", "Front ankle", "Achilles", "Heel"];

export function PainCheckInScreen() {
  const navigation = useNavigation<any>();
  const { savePainEntry } = useAppData();
  const { palette } = useAppTheme();
  // No pre-selected score: the user has to report their own number rather than
  // silently accepting ours, which would log a check-in they never made.
  const [pain, setPain] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState("Outside ankle");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (item: string) => {
    setSymptoms((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  const save = async () => {
    if (isSaving || pain === undefined) return;
    setIsSaving(true);
    savePainEntry({ pain, location, symptoms, notes });
    trackEvent(AnalyticsEvents.painLogStarted, { painScore: pain, painLocation: location, symptoms });
    try {
      const user = (await getCurrentUser()) ?? (await signInAsGuest());
      if (user) {
        await savePainLog(user.uid, {
          painScore: pain,
          symptoms,
          painLocation: location,
          notes
        });
      }
      trackEvent(AnalyticsEvents.painLogSaved, {
        uid: user?.uid,
        isAnonymous: user?.isAnonymous,
        painScore: pain,
        painLocation: location,
        symptoms
      });
      Alert.alert("Check-in saved", "Your recovery log has been updated.", [
        { text: "View tracking", onPress: () => navigation.navigate("Track") }
      ]);
    } catch {
      trackEvent(AnalyticsEvents.painLogFailed, { painScore: pain, painLocation: location, symptoms });
      Alert.alert("Saved on this device", "We could not sync right now, but your local check-in is saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: palette.text }]}>How does your ankle feel?</Text>
      <View style={styles.scale}>
        {Array.from({ length: 11 }, (_, value) => (
          <Pressable
            key={value}
            onPress={() => setPain(value)}
            style={[
              styles.pill,
              { backgroundColor: palette.surface, borderColor: palette.border },
              pain === value && { backgroundColor: palette.teal, borderColor: palette.teal }
            ]}
          >
            <Text style={[styles.pillText, { color: pain === value ? palette.background : palette.text }]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Pain location</Text>
      <View style={styles.list}>
        {painLocations.map((item) => (
          <OptionCard key={item} label={item} selected={location === item} onPress={() => setLocation(item)} />
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>Symptoms</Text>
      <View style={styles.list}>
        {symptomOptions.slice(0, 5).map((item) => (
          <OptionCard key={item} label={item} selected={symptoms.includes(item)} onPress={() => toggle(item)} multi />
        ))}
      </View>
      <TextInput
        multiline
        placeholder="Notes"
        placeholderTextColor={palette.textSubtle}
        value={notes}
        onChangeText={setNotes}
        style={[
          styles.notes,
          {
            color: palette.text,
            backgroundColor: palette.surface,
            borderColor: palette.border
          }
        ]}
        textAlignVertical="top"
      />
      <AppButton
        label={isSaving ? "Saving..." : "Save Check-in"}
        disabled={pain === undefined || isSaving}
        onPress={save}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1
  },
  sectionTitle: {
    ...typography.h2
  },
  scale: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  pillText: {
    ...typography.bodyStrong
  },
  list: {
    gap: spacing.md
  },
  notes: {
    minHeight: 120,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    ...typography.body
  }
});
