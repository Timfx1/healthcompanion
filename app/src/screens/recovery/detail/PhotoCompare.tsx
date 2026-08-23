// ============================================================
// SCREEN: PhotoCompare (§4.11, P9, §9)
//
// Two photos side by side, weeks apart. This is the moment recovery becomes
// visible to somebody living it a day at a time — which is exactly why it is
// the premium feature people will actually pay for, and exactly why the gate
// has to be honest.
//
// THE GATE LIVES HERE AND NOT ON `PhotoCapture`. Taking photos is free and the
// timeline is free (N7); only the COMPARISON is premium (P9). Putting the gate
// on the act of adding a photo would gate the core loop, which is the failure
// P9 was written about.
//
// ─────────────────────────────────────────────────────────────────────────────
// STATES, derived from the entitlement and the photo count:
//   locked        no premium. BOTH PHOTOS ARE VISIBLE — value before the gate
//                 (§9) — and what is withheld is the comparison affordance. A
//                 blank wall here would teach people the app is a billboard.
//   insufficient  premium held, but fewer than two photos. NOT A GATE, and it
//                 must not look like one: the answer is "take another in a
//                 couple of weeks", never "upgrade".
//   ready         premium and enough photos.
//
// That middle state is the one worth having. Without it a subscriber with one
// photo sees either a broken screen or — far worse — an upsell for something
// they have already bought.
//
// NOT states: loading, error. Local files, nothing to fetch.
// ============================================================

import { Image, View } from "react-native";

import { useAppData } from "../../../state/AppDataContext";
import { useAppTheme } from "../../../state/AppThemeContext";
import { useRecoveryData } from "../../../state/RecoveryDataContext";
import { scale } from "../../../theme/tokens.generated";
import type { PhotoEntry } from "../../../types/recovery";
import { comparePair, compareStateOf } from "../../../rules";
import { DetailScreen, DetailButton, DetailCard } from "../../../components/recovery/DetailScreen";
import { Body, Caption } from "../../../components/recovery/primitives";

function Frame({ photo }: { photo: PhotoEntry }) {
  const { tokens } = useAppTheme();
  return (
    <View style={{ flex: 1, gap: scale.space[1] }}>
      <View
        style={{
          width: "100%",
          aspectRatio: 1,
          borderRadius: scale.radius.md,
          backgroundColor: tokens.pattern.rest.surface,
          overflow: "hidden",
        }}
      >
        {!!photo.uri && <Image source={{ uri: photo.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />}
      </View>
      <Caption>{new Date(photo.date).toLocaleDateString()}</Caption>
    </View>
  );
}

export function PhotoCompare({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const { photos } = useRecoveryData();
  const { isPremium } = useAppData();
  const state = compareStateOf(photos.length, isPremium);

  // OLDEST against NEWEST, not the two most recent — Day 3 against Day 30 is
  // the whole point, and the newest pair would make the feature least useful
  // for whoever has been most diligent. The rule is in `rules/select`.
  const pair = comparePair(photos);
  const first = pair?.first ?? photos[0];
  const last = pair?.last;

  return (
    <DetailScreen title="Compare photos" onClose={onClose}>
      {state === "insufficient" ? (
        <>
          <DetailCard>
            <Body>Only one photo so far.</Body>
            <Caption>
              Comparison needs two. Take another in a couple of weeks and this screen will have something to show you.
            </Caption>
          </DetailCard>
          {!!first && (
            <View style={{ flexDirection: "row", gap: scale.space[3] }}>
              <Frame photo={first} />
            </View>
          )}
          {/* No upgrade prompt anywhere in this branch. They have already paid. */}
        </>
      ) : (
        <>
          {/* VALUE BEFORE THE GATE. Both photos render in every state. */}
          {!!first && !!last && (
            <View style={{ flexDirection: "row", gap: scale.space[3] }}>
              <Frame photo={first} />
              <Frame photo={last} />
            </View>
          )}

          {state === "ready" ? (
            <Caption>
              {first?.caption ? `${first.caption} → ` : ""}
              {last?.caption ?? "Side by side."}
            </Caption>
          ) : (
            <>
              <DetailCard>
                <Body>Side-by-side comparison is part of premium.</Body>
                <Caption>
                  Your photos, your timeline and your doctor report stay free. This screen adds the alignment and
                  measurement tools on top of them.
                </Caption>
              </DetailCard>
              <DetailButton label="See what is included" onPress={onUnlock} />
            </>
          )}
        </>
      )}
    </DetailScreen>
  );
}
