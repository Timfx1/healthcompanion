// ============================================================
// SCREEN: PhotoCapture (§4.11, P10, N7)
//
// Add a wound / swelling / scar photo to the timeline.
//
// THE PRIVACY CUE COMES BEFORE THE CONTROLS, not after them. P10 asks for
// "stays on your device" wherever photos are handled, and a reassurance placed
// under the button is a reassurance offered after the decision has been made.
// Somebody deciding whether to photograph a surgical wound is deciding at the
// moment they read this screen, not afterwards.
//
// STATES, derived from whether an image has been chosen:
//   empty   nothing picked. Privacy cue, then the controls.
//   chosen  an image is selected. The caption is OPTIONAL — P1's rule applies
//           to every capture path, and a required caption would make this the
//           one place in the product that argues with a user holding a phone in
//           one hand.
//
// N7 — taking a photo is core loop and free forever. The premium gate belongs
// on COMPARING photos and lives in PhotoCompare; putting it here would gate the
// core loop, which is the failure P9 was written about.
// ============================================================

import { useState } from "react";
import { Image, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useAppTheme } from "../../../state/AppThemeContext";
import { scale } from "../../../theme/tokens.generated";
import { DetailScreen, DetailButton, DetailCard } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

export function PhotoCapture({ onClose, onSave }: { onClose: () => void; onSave: (uri: string, caption: string) => void }) {
  const { tokens } = useAppTheme();
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  async function pick(from: "camera" | "library") {
    // Permission refusal is not an error state. Somebody declining to give a
    // health app camera access has made a reasonable choice, and the screen has
    // nothing to say about it beyond staying where it is.
    try {
      const permission =
        from === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result =
        from === "camera"
          ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, legacy: true });
      if (!result.canceled && result.assets[0]) setUri(result.assets[0].uri);
    } catch {
      return;
    }
  }

  return (
    <DetailScreen title="Add a photo" onClose={onClose}>
      {/* BEFORE the controls. See the header note. */}
      <DetailCard>
        <Body>Stays on your device.</Body>
        <Caption>
          Photos are stored locally and are never uploaded. They appear on your timeline and in your doctor report,
          and nowhere else.
        </Caption>
      </DetailCard>

      {uri && (
        <Image
          source={{ uri }}
          accessibilityLabel="Selected photo"
          style={{
            width: "100%",
            height: scale.size.shellWidth,
            borderRadius: scale.radius.lg,
            backgroundColor: tokens.color.surface.card,
          }}
          resizeMode="cover"
        />
      )}

      <View style={{ flexDirection: "row", gap: scale.space[2] }}>
        <View style={{ flex: 1 }}>
          <DetailButton label="Take a photo" onPress={() => pick("camera")} />
        </View>
        <View style={{ flex: 1 }}>
          <DetailButton label="Choose one" onPress={() => pick("library")} />
        </View>
      </View>

      {uri && (
        <>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="A note about this one (optional)"
            placeholderTextColor={tokens.color.text.muted}
            accessibilityLabel="Photo caption"
            style={{
              minHeight: scale.size.buttonSecondary,
              borderRadius: scale.radius.md,
              borderWidth: scale.size.hairline,
              borderColor: tokens.color.surface.border,
              paddingHorizontal: scale.space[3],
              color: tokens.color.text.primary,
              fontSize: tokens.type.body.size,
            }}
          />
          <DetailButton label="Add to timeline" onPress={() => { onSave(uri, caption); onClose(); }} />
        </>
      )}
    </DetailScreen>
  );
}
