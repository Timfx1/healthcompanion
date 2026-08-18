import { Ionicons } from "@expo/vector-icons";
import { TrackerKey } from "../state/AppDataContext";

export type TrackerOption = {
  value: number;
  label: string;
  hint: string;
};

export type TrackerConfig = {
  key: TrackerKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  prompt: string;
  options: TrackerOption[];
};

export const trackerConfigs: Record<TrackerKey, TrackerConfig> = {
  swelling: {
    key: "swelling",
    title: "Swelling check-in",
    icon: "water",
    prompt: "How swollen is your ankle right now?",
    options: [
      { value: 0, label: "None", hint: "Looks like the other side" },
      { value: 1, label: "Mild", hint: "Slightly puffy" },
      { value: 2, label: "Moderate", hint: "Clearly swollen" },
      { value: 3, label: "Severe", hint: "Very swollen / tight" }
    ]
  },
  walking: {
    key: "walking",
    title: "Walking ability",
    icon: "walk",
    prompt: "How well can you walk today?",
    options: [
      { value: 0, label: "Can't bear weight", hint: "No weight on the foot" },
      { value: 1, label: "Only with support", hint: "Crutches or holding on" },
      { value: 2, label: "Short distances", hint: "Around the house" },
      { value: 3, label: "Normal walking", hint: "Comfortable, unaided" }
    ]
  },
  rangeOfMotion: {
    key: "rangeOfMotion",
    title: "Range of motion",
    icon: "repeat",
    prompt: "How is your ankle movement today?",
    options: [
      { value: 0, label: "Very stiff", hint: "Barely moves" },
      { value: 1, label: "Limited", hint: "About half of normal" },
      { value: 2, label: "Almost full", hint: "Slightly restricted" },
      { value: 3, label: "Full range", hint: "Moves freely" }
    ]
  },
  balance: {
    key: "balance",
    title: "Balance test",
    icon: "body",
    prompt: "Single-leg balance: how long can you hold it?",
    options: [
      { value: 0, label: "Under 5 seconds", hint: "Or can't yet" },
      { value: 1, label: "5–15 seconds", hint: "With some wobble" },
      { value: 2, label: "15–30 seconds", hint: "Fairly steady" },
      { value: 3, label: "Over 30 seconds", hint: "Solid and controlled" }
    ]
  }
};
