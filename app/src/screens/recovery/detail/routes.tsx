// ============================================================
// FILE: detail/routes.tsx — the navigation adapters for the §5 detail set.
//
// WHY THIS LAYER EXISTS. Every screen in this directory takes plain props: a
// medication, an appointment, an `onClose`. None of them imports a navigator,
// and none of them knows it is on a stack.
//
// That is not fastidiousness. The web prototype's equivalents take exactly the
// same props, which is what makes the two ports comparable at all — and a
// screen that reaches for `useNavigation` internally cannot be rendered in a
// harness, a story, or a test without standing up a navigator around it. The RN
// app has no harness yet; the screens should not be the reason it stays that
// way.
//
// So this file is the ONLY place that knows about routes, params and the stack.
// Each adapter resolves an ID against the store and hands the screen its data.
//
// IDs IN, OBJECTS OUT. Params are ids rather than pre-assembled objects, so a
// screen opened from two places behaves identically and keeps reflecting edits
// made after it was opened. A missing id renders a plain "not found" rather
// than crashing — a stale deep link is a routing bug, not a reason to lose the
// app.
// ============================================================

import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { dayNumber } from "../../../types/recovery";
import type { MainStackParamList } from "../../../navigation/types";
import { DetailScreen } from "../../../components/recovery/DetailScreen";
import { Body } from "../../../components/recovery/primitives";

import { QuickCaptureSheet } from "./QuickCaptureSheet";
import { AddTimelineEntry, type EntryKind } from "./AddTimelineEntry";
import { JournalEntryScreen } from "./JournalEntryScreen";
import { MilestoneDetail } from "./MilestoneDetail";
import { ShareCardPreview } from "./ShareCardPreview";
import { MedicationDetail } from "./MedicationDetail";
import { AppointmentDetail } from "./AppointmentDetail";
import { QuestionsForDoctor } from "./QuestionsForDoctor";
import { PhotoCapture } from "./PhotoCapture";
import { PhotoCompare } from "./PhotoCompare";
import { ReportPreview } from "./ReportPreview";
import { ReportDateRange, type RangeKey } from "./ReportDateRange";
import { EducationArticle } from "./EducationArticle";
import { SafetyScreen } from "./SafetyScreen";
import { WeeklyReflectionScreen } from "./WeeklyReflection";

type Nav = NativeStackNavigationProp<MainStackParamList>;

function useBack() {
  const navigation = useNavigation<Nav>();
  return () => navigation.goBack();
}

/** A stale id is a routing bug. Say so; do not crash. */
function NotFound({ what, onClose }: { what: string; onClose: () => void }) {
  return (
    <DetailScreen title={what} onClose={onClose}>
      <Body>That {what.toLowerCase()} is no longer available.</Body>
    </DetailScreen>
  );
}

export function RcQuickCaptureRoute() {
  return <QuickCaptureSheet onClose={useBack()} />;
}

export function RcAddEntryRoute() {
  const navigation = useNavigation<Nav>();
  const back = useBack();
  // The FAB sheet is a router, so the mapping from a chosen kind to a screen
  // lives here rather than inside the sheet.
  const go = (kind: EntryKind) => {
    navigation.goBack();
    if (kind === "capture") navigation.navigate("RcQuickCapture");
    else if (kind === "note") navigation.navigate("RcJournal");
    else if (kind === "photo") navigation.navigate("RcPhotoCapture");
    else if (kind === "milestone") navigation.navigate("RcJournal");
    else if (kind === "medication") navigation.navigate("MainTabs");
    else navigation.navigate("MainTabs");
  };
  return <AddTimelineEntry onClose={back} onPick={go} />;
}

export function RcJournalRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcJournal">>();
  const { timeline } = useRecoveryData();
  const entry = route.params?.entryId ? timeline.find((e) => e.id === route.params!.entryId) : undefined;
  return <JournalEntryScreen entry={entry} onClose={useBack()} />;
}

export function RcMilestoneRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcMilestone">>();
  const navigation = useNavigation<Nav>();
  const back = useBack();
  const { milestones, journey } = useRecoveryData();
  const milestone = milestones.find((m) => m.id === route.params.milestoneId);
  if (!milestone) return <NotFound what="Milestone" onClose={back} />;
  return (
    <MilestoneDetail
      milestone={milestone}
      dayN={dayNumber(journey.startDate, new Date(milestone.date).getTime())}
      onClose={back}
      onShare={() =>
        navigation.navigate("RcShareCard", {
          title: milestone.title,
          dayN: dayNumber(journey.startDate, new Date(milestone.date).getTime()),
          date: new Date(milestone.date).toLocaleDateString(),
        })
      }
    />
  );
}

export function RcShareCardRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcShareCard">>();
  return <ShareCardPreview {...route.params} onClose={useBack()} />;
}

export function RcMedicationRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcMedication">>();
  const back = useBack();
  const { medications } = useRecoveryData();
  const medication = medications.find((m) => m.id === route.params.medicationId);
  if (!medication) return <NotFound what="Medication" onClose={back} />;
  return <MedicationDetail medication={medication} onClose={back} />;
}

export function RcAppointmentRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcAppointment">>();
  const navigation = useNavigation<Nav>();
  const back = useBack();
  const { appointments } = useRecoveryData();
  const appointment = appointments.find((a) => a.id === route.params.appointmentId);
  if (!appointment) return <NotFound what="Appointment" onClose={back} />;
  return (
    <AppointmentDetail
      appointment={appointment}
      onClose={back}
      onOpenReport={() => navigation.navigate("RcReport")}
      onOpenQuestions={() => navigation.navigate("RcQuestions", { appointmentId: appointment.id })}
    />
  );
}

export function RcQuestionsRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcQuestions">>();
  const back = useBack();
  const { appointments } = useRecoveryData();
  const appointment = appointments.find((a) => a.id === route.params.appointmentId);
  if (!appointment) return <NotFound what="Appointment" onClose={back} />;
  return <QuestionsForDoctor appointment={appointment} onClose={back} />;
}

export function RcPhotoCaptureRoute() {
  const back = useBack();
  // Through the store, exactly like every other capture path — no separate
  // write and no separate failure mode.
  //
  // This first filed the photo as a JOURNAL entry with the file path as its
  // body, which would have put a uri on the timeline and left `photos` empty,
  // so PhotoCompare would have had nothing to compare. Caught by reading the
  // adapter, not by rendering it — nothing renders these screens yet.
  const { addPhoto } = useRecoveryData();
  return <PhotoCapture onClose={back} onSave={addPhoto} />;
}

export function RcPhotoCompareRoute() {
  const navigation = useNavigation<Nav>();
  return <PhotoCompare onClose={useBack()} onUnlock={() => navigation.navigate("PremiumTeaser")} />;
}

export function RcReportRoute() {
  const navigation = useNavigation<Nav>();
  return <ReportPreview onClose={useBack()} onOpenRange={() => navigation.navigate("RcReportRange")} />;
}

export function RcReportRangeRoute() {
  const back = useBack();
  // The chosen range is local to the picker in Phase 1. Persisting it would be
  // a preference, and preferences are Phase 2's problem — but the picker is
  // still real: it counts what each window actually yields.
  return <ReportDateRange selected={"sinceVisit" as RangeKey} onSelect={() => {}} onClose={back} />;
}

export function RcArticleRoute() {
  const route = useRoute<RouteProp<MainStackParamList, "RcArticle">>();
  const navigation = useNavigation<Nav>();
  return (
    <EducationArticle
      articleId={route.params.articleId}
      onClose={useBack()}
      onUnlock={() => navigation.navigate("PremiumTeaser")}
    />
  );
}

export function RcSafetyRoute() {
  return <SafetyScreen onClose={useBack()} />;
}

export function RcWeeklyRoute() {
  return <WeeklyReflectionScreen onClose={useBack()} />;
}
