// ============================================================
// FILE: device/check.mjs — the claims only a device can settle.
//
// WHY THIS EXISTS. `harness/` renders the screens under `react-native-web`, and
// §11 states the limit plainly: a baseline there is evidence about structure,
// hierarchy and colour, and NOT about how a shadow, a font metric, a safe-area
// inset or a linear gradient lands on Android. `harness/slice.spec.ts` closed
// the provider seam and narrowed nothing about the device.
//
// So this file asks only the questions the web harness CANNOT ask, on a real
// Android runtime, through adb:
//
//   1. The Day-N gradient actually renders — measured at both stops. It shipped
//      FLAT once, and importing `expo-linear-gradient` produced a silent blank
//      page once. A CSS shim cannot testify about either.
//   2. Safe-area insets on the five tabs and the centre check-in action, against
//      the insets the window manager actually reports.
//   3. §7's ≤10s acceptance benchmarks, measured on device, plus a GEOMETRIC
//      thumb-zone check.
//   4. `expo-image-picker`, including the permission-REFUSAL path.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS IS EVIDENCE ABOUT, STATED BEFORE THE RESULTS
//
// A harness that overstates its reach is the same failure as a check that
// cannot fail, so:
//
//   • It is an EMULATOR, not a handset. Layout, insets, font metrics and the
//     GPU compositor are the real Android ones; thermal behaviour, real touch
//     latency and OEM skins are not.
//   • It is ANDROID. Nothing here says anything about iOS, and no iOS simulator
//     exists on Windows at all. That gap stays open and is not narrowed.
//   • It is EXPO GO, so this is a debug bundle: no minification, no release
//     build, and the Sentry / RevenueCat / Google-Sign-In shell is absent.
//     No Recovery Companion screen touches any of it. The SCREENS, the
//     PROVIDERS and the RULES under test are the shipped ones.
//   • The timings are measured from `adb shell input tap` to a rendered change.
//     That includes adb round-trip cost, so they are an UPPER BOUND on what a
//     finger would experience, not a simulation of one.
//   • The thumb-zone check is GEOMETRY, not ergonomics. It asserts that a
//     control lands inside a stated rectangle. It is a proxy for one-handed
//     reachability and NOT a substitute for a human holding a phone; that half
//     of §7 remains unverified and is recorded as such.
// ============================================================

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  density, dump, find, framebuffer, hex, insets, screencap, screenSize, shell, sleep, tapNode, waitFor,
} from "./adb.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(HERE, "__evidence__");
mkdirSync(EVIDENCE, { recursive: true });

const TOKENS = JSON.parse(
  await import("node:fs").then((fs) =>
    fs.readFileSync(join(HERE, "..", "..", "design-system", "dist", "tokens.json"), "utf8"),
  ),
);

// ── Reporting ───────────────────────────────────────────────────────────────
const results = [];
function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, ok: true, detail });
    console.log(`  PASS  ${name}${detail ? `\n          ${detail}` : ""}`);
  } catch (e) {
    results.push({ name, ok: false, detail: e.message });
    console.log(`  FAIL  ${name}\n          ${e.message}`);
  }
}
function assert(cond, message) {
  if (!cond) throw new Error(message);
}
const shot = (name) => {
  writeFileSync(join(EVIDENCE, `${name}.png`), screencap());
  return name;
};

// ── Colour helpers ──────────────────────────────────────────────────────────
const rgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16),
  g: parseInt(h.slice(3, 5), 16),
  b: parseInt(h.slice(5, 7), 16),
});
const dist = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

/** The most common colour in a horizontal band — robust against text pixels. */
function bandColour(fb, y, x1, x2) {
  const counts = new Map();
  for (let x = x1; x < x2; x += 2) {
    const p = fb.at(x, y);
    const k = `${p.r},${p.g},${p.b}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const [k] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const [r, g, b] = k.split(",").map(Number);
  return { r, g, b };
}

// ── Getting to the Recovery Companion tabs ──────────────────────────────────
//
// A fresh Expo Go install has `onboardingCompleted` false, so the app opens on
// AnklePath's onboarding stack. Rather than hard-code eleven screens — a list
// that rots the moment one changes — this advances by looking for a primary
// action, and selects an option first when the action is not there yet.
const ADVANCE = [
  "continue as guest", "continue with free", "start recovery plan", "continue", "next", "get started",
  "agree", "accept", "i agree", "done", "finish", "maybe later", "not now",
  "skip", "allow", "start",
];

// NEVER TAPPED. The driver answers every question on a screen before pressing
// the forward action, which is what finally got it through onboarding — and
// that also means it would happily press "Join Premium Waitlist", which writes
// to Firestore and opens an Alert. A driver that can take a real action on the
// user's behalf while merely navigating is a driver that has to be told not to.
const AVOID = [
  "waitlist",
  "join premium",
  "subscribe",
  "upgrade",
  "buy",
  "purchase",
  "restore",
  "continue with apple",
  "continue with google",
  "continue with email",
  "privacy",
  "terms",
  "legal",
  "impressum",
  "github.io",
];

function onRecoveryHome(nodes) {
  return Boolean(find(nodes, "Quick capture"));
}

// Expo Go's dev menu and element inspector draw OVER the app and swallow taps.
// The first run of this driver spent all forty steps tapping an app it could no
// longer reach, because the inspector had been toggled on and every subsequent
// tap went to "Tap something to inspect it". Recognise it and turn it off.
//
// Note what is NOT used to escape it: the BACK key. Sending keyevent 4 leaves
// Expo Go entirely and resumes whatever was behind it — which here was a
// three-month-old embedded build of the same app, and the dump looked plausible
// enough to keep measuring. A driver that can silently end up on a different
// build is worse than one that stops.
const DEV_OVERLAY = [
  "tap something to inspect",
  "touchables",
  "performance",
  "inspect",
  "this is the developer menu",
  "sdk version:",
  "runtime version:",
];

function dismissDevOverlay(nodes) {
  const inspector = nodes.find((n) => DEV_OVERLAY.some((d) => (n.text || n.desc).toLowerCase().includes(d)));
  if (!inspector) return false;
  const devMenuContinue = nodes.find((n) => n.clickable && (n.text || n.desc).toLowerCase().trim() === "continue");
  if (devMenuContinue) {
    tapNode(devMenuContinue);
    sleep(1200);
    return true;
  }
  const toggle = nodes.find((n) => (n.text || n.desc).toLowerCase().trim() === "inspect");
  if (toggle) tapNode(toggle);
  sleep(800);
  return true;
}

function reachRecoveryTabs() {
  let lastSignature = "";
  let repeats = 0;

  for (let step = 0; step < 70; step++) {
    let nodes = dump();
    if (onRecoveryHome(nodes)) return step;
    if (dismissDevOverlay(nodes)) {
      nodes = dump();
      if (onRecoveryHome(nodes)) return step;
    }

    // ALREADY INSIDE THE APP. Onboarding state persists across Expo Go
    // restarts, so a second run starts past it — and a driver that only knows
    // how to press "the forward action" then walks INTO the app, tapping
    // whatever it finds. One run navigated itself into the doctor report and
    // reported a stuck screen. The bottom bar is the unambiguous signal that
    // onboarding is done; from anywhere in the app, Home is one tap away.
    const homeTab = nodes.find(
      (n) => n.clickable && n.desc.replace(/^,\s*/, "") === "Home" && n.cy > size.h * 0.85,
    );
    if (homeTab) {
      tapNode(homeTab);
      sleep(1200);
      if (onRecoveryHome(dump())) return step;
      // On Home but the capture field is not visible: a detail screen is over
      // it. Close it with the screen's own back affordance, never keyevent 4.
      const back = nodes.find((n) => n.clickable && /^(←|<|Close|Back)$/i.test((n.text || n.desc).trim()));
      if (back) {
        tapNode(back);
        sleep(900);
        continue;
      }
    }

    const signature = nodes.filter((n) => n.text).map((n) => n.text).join("|").slice(0, 200);
    repeats = signature === lastSignature ? repeats + 1 : 0;
    lastSignature = signature;
    if (repeats >= 6) {
      throw new Error(
        `stuck on the same screen for 6 steps. On screen: ` +
        nodes.filter((n) => n.text).map((n) => JSON.stringify(n.text.slice(0, 40))).join(", "),
      );
    }

    // Only ever tap inside the app's own content, never a dev overlay strip
    // along the very bottom of the window.
    //
    // THE HEIGHT FLOOR IS 12px, NOT 40px, and lowering it is a finding rather
    // than a tweak. AnklePath's onboarding `Continue` reports bounds of
    // `y1=2299 y2=2337` for its label and `y1=2344 y2=2337` — a NEGATIVE height
    // — for the touchable itself, because the control is clipped at the bottom
    // of the window where the gesture inset begins (y=2337 on this device). A
    // 40px floor silently dropped it, so the driver could not press Continue at
    // all and looked merely stuck. See the safe-area check below.
    const clickable = nodes.filter((n) => n.clickable && n.w > 40 && n.h > 12 && n.y1 < size.h - 20);
    const isCta = (n) => {
      const t = (n.text || n.desc).toLowerCase().trim();
      return ADVANCE.some((a) => t === a || t.startsWith(a));
    };
    const label = (n) => (n.text || n.desc).toLowerCase().trim();
    const avoided = (n) => AVOID.some((a) => label(n).includes(a));
    const cta = clickable.find((n) => isCta(n) && !avoided(n));
    // Anything that is not the forward action: an option card, a consent
    // toggle, a checkbox. Never anything on the AVOID list.
    const options = clickable.filter((n) => !isCta(n) && !avoided(n) && n.cy < size.h * 0.85);

    // ANSWER EVERY QUESTION ON THE SCREEN, THEN PRESS THE ACTION.
    //
    // Two earlier shapes failed, and both failed quietly:
    //
    //   • "tap the CTA; if the screen does not change, tap one option and retry"
    //     never got past the first question, because tapping a pain value
    //     CHANGES the screen — the selected numeral is rendered — so the
    //     stuck-screen counter reset on every attempt and the driver looped
    //     between one option and a disabled Continue until the step budget ran
    //     out. A retry heuristic keyed on "did anything change" cannot tell
    //     progress from acknowledgement.
    //   • Cycling one target per step exhausted the budget on the pain screen,
    //     which offers eleven buttons for one question.
    //
    // Grouping clickables by row and taking the first of each answers each
    // question exactly once, which is what these screens ask for, and finishes
    // a screen in a single step.
    const rows = [...new Map(options.map((n) => [Math.round(n.y1 / 40), n])).values()];
    if (rows.length) {
      for (const row of rows) {
        tapNode(row);
        sleep(220);
      }
    }
    if (cta) {
      sleep(400);
      tapNode(cta);
    } else if (!rows.length) {
      throw new Error(`stuck at step ${step}: nothing clickable`);
    }
    // Give the navigator its transition. Plan loading is deliberately slow.
    sleep(1100);
  }
  throw new Error("did not reach the Recovery Companion tabs in 70 steps");
}

// ─────────────────────────────────────────────────────────────────────────────
console.log("\nDevice checks — a real Android runtime, over adb.\n");

// ── WHOSE APP IS ON SCREEN? ─────────────────────────────────────────────────
//
// THIS GUARD IS NOT PARANOIA. This emulator also has an EAS build of the same
// app installed (`com.timfx1.healthcompanion`) carrying an embedded bundle from three
// months ago. Twice during this session Android resumed it behind Expo Go, and
// the `uiautomator` dump looked entirely plausible — same app name, same
// onboarding shape, subtly different copy. Every measurement taken then was of
// code nobody had written today.
//
// A harness that can silently measure the wrong build is worse than no harness.
// So: assert the foreground package, every run, before anything is measured.
const HOST = "host.exp.exponent";
const foreground = /com\.[\w.]+|host\.exp\.exponent/.exec(
  shell("dumpsys", "activity", "activities").split("topResumedActivity")[1]?.slice(0, 200) ?? "",
)?.[0];
if (foreground !== HOST) {
  console.error(
    `\nThe foreground app is ${foreground ?? "unknown"}, not Expo Go (${HOST}).\n` +
    `This emulator also has an EAS build of the same app installed, with an embedded\n` +
    `bundle from a different commit. Refusing to measure it.\n\n` +
    `  adb shell am force-stop com.timfx1.healthcompanion\n` +
    `  adb reverse tcp:8081 tcp:8081\n` +
    `  adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081"\n`,
  );
  process.exit(2);
}

const size = screenSize();
const dpi = density();
const ins = insets();
const toDp = (px) => Math.round((px / dpi) * 160);
console.log(
  `  device   ${size.w}x${size.h}px @ ${dpi}dpi  =  ${toDp(size.w)}x${toDp(size.h)}dp` +
  `   insets: status ${ins.statusBar}px, nav ${ins.navBar}px\n`,
);

const steps = reachRecoveryTabs();
console.log(`  reached the Recovery Companion tabs in ${steps} onboarding steps\n`);
shot("00-home");

// Which mode is on screen decides which tokens to measure against. Read it from
// the page rather than assuming, because measuring dark values against a light
// render is how a check reports a defect that is not there.
const homeFb = framebuffer();
const pageColour = homeFb.at(Math.round(size.w / 2), Math.round(size.h * 0.5));
const MODE =
  dist(pageColour, rgb(TOKENS.modes.dark.color.surface.base)) <
  dist(pageColour, rgb(TOKENS.modes.light.color.surface.base))
    ? "dark"
    : "light";
const T = TOKENS.modes[MODE];
console.log(`  rendering in ${MODE} mode (page ${hex(pageColour)})\n`);

// ── The tab bar, found by its LABELS rather than by guessed geometry ─────────
//
// The first version took "the largest clickable in the bottom 15%" as the
// centre action and reported it at cx=945 — the Profile tab. All four tabs are
// exactly 270x146 and the centre action is 147x147, so the centre action is the
// SMALLEST item in the bar, not the largest. The check was measuring the wrong
// view and failing honestly for the wrong reason.
const TABS = ["Home", "Timeline", "Progress", "Profile"];

/**
 * The announced label, with icon glyphs removed.
 *
 * A tab's `content-desc` is not ", Home" — it is `", Home"`. React Native
 * composes a pressable's accessibility label from its children, and the icon is
 * an `Ionicons` <Text> whose character is a PRIVATE USE AREA codepoint from the
 * icon font. `JSON.stringify` prints it as nothing at all, so the value looks
 * like ", Home" in any log and compares equal to nothing. The matcher here was
 * written against what the log showed and found no tabs at all; only dumping
 * `charCodeAt` found the 62339 hiding in front.
 *
 * The defect underneath is recorded in DESIGN_CRITERIA §11: TalkBack announces
 * that codepoint before the tab name.
 */
const announced = (n) => (n.desc || n.text).replace(/[^\x20-\x7E]/g, "").replace(/^[,\s]+|[,\s]+$/g, "");

function tabBar() {
  const nodes = dump();
  const tabs = TABS.map((name) => {
    const node = nodes.find((n) => n.clickable && announced(n) === name);
    assert(node, `no bottom-bar item labelled "${name}"`);
    return { name, ...node };
  });
  const centre = nodes.find((n) => n.clickable && (n.desc || n.text).toLowerCase().includes("check in") && n.cy > size.h * 0.8);
  assert(centre, "no centre check-in action in the bottom bar");
  return { nodes, tabs, centre };
}

function checkInCount(nodes) {
  for (const n of nodes) {
    const label = `${n.text || ""} ${n.desc || ""}`;
    const match = /\b(\d+)\s+check-?ins?\b/i.exec(label);
    if (match) return Number(match[1]);
  }
  return 0;
}

// ── 1. THE DAY-N GRADIENT ───────────────────────────────────────────────────
check("the Day-N gradient renders, and BOTH stops are on screen", () => {
  const nodes = dump();
  // BOUND THE CARD, not the text. The first version sampled 30px above and 60px
  // below the "Day 46" label, which are both deep inside the middle of the
  // ramp — it read #F5F3FC and #F4F2FC, called the card FLAT, and would have
  // reported the same on a genuinely flat card. The card runs from its section
  // label to the line under the numeral, so use those.
  const label = find(nodes, "YOUR RECOVERY");
  const sub = find(nodes, "Started");
  assert(label && sub, "could not bound the Day-N card ('YOUR RECOVERY' / 'Started')");

  const fb = framebuffer();
  const top = label.y1 - 22;
  const bottom = sub.y2 + 22;
  const x1 = label.x1 - 20;
  const x2 = Math.min(x1 + 240, size.w - 30);
  assert(top > 0 && bottom < size.h, "the Day-N card is off-screen");

  const upper = bandColour(fb, top, x1, x2);
  const lower = bandColour(fb, bottom, x1, x2);
  const from = rgb(T.pattern.dayCard.from);
  const to = rgb(T.pattern.dayCard.to);

  // THE DEFECT THIS EXISTS FOR: the card once rendered FLAT, with only
  // `dayCard.to` set, so the contrast manifest's "at gradient start" pair
  // described a backdrop that was not on screen. A flat card makes these equal.
  assert(
    dist(upper, lower) >= 6,
    `the card is FLAT: ${hex(upper)} at the top and ${hex(lower)} at the bottom ` +
    `(expected a gradient from ${T.pattern.dayCard.from} to ${T.pattern.dayCard.to})`,
  );

  // And it is the RIGHT gradient, in the right direction — not merely two
  // different colours. `expo-linear-gradient` really rendered here, which is
  // the other half of the claim: importing it produced a silent blank page once.
  assert(
    dist(upper, from) < dist(upper, to),
    `the top of the card (${hex(upper)}) is nearer \`to\` (${T.pattern.dayCard.to}) ` +
    `than \`from\` (${T.pattern.dayCard.from}) — the gradient runs backwards`,
  );
  return `top ${hex(upper)} -> bottom ${hex(lower)}, ${dist(upper, lower)} apart; ` +
         `declared ${T.pattern.dayCard.from} -> ${T.pattern.dayCard.to}. ` +
         `expo-linear-gradient rendered on device.`;
});

// ── 2. SAFE-AREA INSETS ─────────────────────────────────────────────────────
check("the five tabs clear the gesture inset", () => {
  const { tabs, centre } = tabBar();
  const covered = [...tabs, { name: "check-in", ...centre }].filter((n) => n.y2 > ins.navTop);
  assert(
    covered.length === 0,
    `${covered.length} bar item(s) extend past the gesture inset, which begins at y=${ins.navTop}: ` +
    covered.map((n) => `${n.name} ends y=${n.y2}`).join(", "),
  );
  return `nav inset begins y=${ins.navTop}; lowest bar edge y=${Math.max(...tabs.map((n) => n.y2))}`;
});

check("the centre action is centred and large enough to hit", () => {
  const { centre } = tabBar();
  assert(
    Math.abs(centre.cx - size.w / 2) < size.w * 0.06,
    `the centre action is not centred: cx=${centre.cx}, screen centre=${size.w / 2}`,
  );
  // Android's own minimum is 48dp. This is the primary daily action.
  assert(toDp(centre.h) >= 48, `the centre action is ${toDp(centre.h)}dp tall, under the 48dp minimum`);
  return `centred at cx=${centre.cx}, ${toDp(centre.w)}x${toDp(centre.h)}dp`;
});

check("nothing is drawn under the status bar", () => {
  const nodes = dump();
  const top = ins.statusBar;
  const covered = nodes.filter((n) => (n.text || n.desc) && n.y1 < top);
  assert(
    covered.length === 0,
    `${covered.length} view(s) start above y=${top}, under the status bar: ` +
    covered.map((n) => `${JSON.stringify((n.text || n.desc).slice(0, 24))} at y=${n.y1}`).join(", "),
  );
  return `status-bar inset ${top}px, topmost content at y=${Math.min(...nodes.filter((n) => n.text).map((n) => n.y1))}`;
});

// ── 3. §7'S ACCEPTANCE BENCHMARKS, AND A GEOMETRIC THUMB-ZONE CHECK ─────────
//
// THE THUMB ZONE, defined here rather than assumed. Taking the common
// one-handed model: a right thumb pivots near the lower corner and comfortably
// sweeps an arc of roughly 60% of the screen height from the bottom. So the
// rectangle is the bottom 60% of the display, full width. Stated as a number so
// the check can be argued with — and it is GEOMETRY, not ergonomics.
const THUMB_TOP = Math.round(size.h * 0.40);

check("the centre check-in action is inside the thumb zone", () => {
  const { centre } = tabBar();
  assert(
    centre.y1 > THUMB_TOP,
    `the centre action starts at y=${centre.y1}, above the thumb zone (y>${THUMB_TOP})`,
  );
  return `centre action at y=${centre.y1}, thumb zone is y>${THUMB_TOP} (bottom 60% of ${size.h}px)`;
});

check("P3 — the fast path is one tap, and it is measured on device", () => {
  const beforeNodes = dump();
  const beforeCount = checkInCount(beforeNodes);
  const { centre } = tabBar();

  const started = Date.now();
  tapNode(centre);
  const opened = waitFor("the check-in sheet", () => {
    const n = dump();
    return find(n, "Better") ? n : null;
  });

  const better = find(opened.value, "Better");
  assert(better.y1 > THUMB_TOP, `the fast path sits at y=${better.y1}, above the thumb zone (y>${THUMB_TOP})`);

  // ONE TAP COMMITS. No typing, no second confirm, no required field — so the
  // check-in must be recorded without touching anything else. Proved by the
  // accumulation pill on Home increasing from whatever real user state existed
  // before the tap. This used to assert 24 -> 25, which was only true when the
  // app shipped with demo data seeded into a fresh install.
  tapNode(better);
  const committed = waitFor("the check-in to be recorded", () => {
    const n = dump();
    return checkInCount(n) === beforeCount + 1 ? n : null;
  }, { timeoutMs: 12_000 });
  const elapsed = Date.now() - started;
  shot("01-checkin-committed");

  assert(elapsed < 10_000, `the fast path took ${(elapsed / 1000).toFixed(1)}s, over §7's 10s budget`);
  return `2 taps (open, answer) and the count moved ${beforeCount} -> ${beforeCount + 1} in ${(elapsed / 1000).toFixed(2)}s wall clock, ` +
         `adb round trips included, so this is an UPPER BOUND. ` +
         `Fast path at y=${better.y1}; sheet appeared after ${opened.ms}ms, committed ${committed.ms}ms later.`;
});

// ── 4. THE IMAGE PICKER, INCLUDING REFUSAL ──────────────────────────────────
check("expo-image-picker's permission REFUSAL is not an error state", () => {
  // Revoke first, so the REFUSAL path is the one actually taken rather than a
  // grant cached from an earlier run. Expo Go is the host process, so its
  // permissions are the ones the picker asks for.
  for (const perm of ["android.permission.READ_MEDIA_IMAGES", "android.permission.READ_MEDIA_VIDEO", "android.permission.CAMERA"]) {
    shell("pm", "revoke", "host.exp.exponent", perm);
  }
  shell("logcat", "-c");

  // Timeline -> the add sheet -> Photo -> "Choose one".
  const { tabs } = tabBar();
  tapNode(tabs.find((t) => t.name === "Timeline"));
  sleep(1200);

  let nodes = dump();
  const fab = nodes.find((n) => n.clickable && (n.desc || n.text).toLowerCase().includes("add to timeline"));
  assert(fab, "no 'Add to timeline' action on the Timeline tab");
  tapNode(fab);
  sleep(1200);

  nodes = dump();
  const photoRow = find(nodes, "Photo");
  assert(photoRow, "no Photo destination in the add sheet");
  tapNode(photoRow);
  sleep(1400);

  nodes = dump();
  const choose = nodes.find((n) => n.clickable && (n.text || n.desc).toLowerCase().includes("choose one"))
    ?? find(nodes, "Choose one");
  assert(choose, `not on the photo screen. On screen: ${nodes.filter((n) => n.text).map((n) => n.text.slice(0, 22)).join(" | ")}`);
  tapNode(choose);
  sleep(2500);

  // If a system permission dialog appeared, DENY it. That is the path under
  // test: the screen's own comment says refusal "is not an error state", and
  // `pick()` awaits `launchImageLibraryAsync` with no catch — so if the module
  // REJECTS on refusal rather than returning `canceled`, this is an unhandled
  // rejection on a screen that promises calm.
  nodes = dump();
  const deny = nodes.find((n) => /don't allow|deny|cancel/i.test(n.text || n.desc));
  const sawDialog = Boolean(deny);
  if (deny) {
    tapNode(deny);
    sleep(2000);
  } else {
    const topActivity = shell("dumpsys", "activity", "activities")
      .split("topResumedActivity")[1]?.slice(0, 240) ?? "";
    if (topActivity.includes("com.google.android.photopicker")) {
      shell("input", "keyevent", "4");
      sleep(2000);
    }
  }

  const log = shell("logcat", "-d", "-t", "400");
  const fatal = log.split("\n").filter((l) =>
    /Unhandled|Possible Unhandled Promise|ReactNativeJS.*Error|FATAL EXCEPTION/.test(l));
  shot("02-photo-permission-refused");

  nodes = dump();
  const stillThere = find(nodes, "Stays on your device") || find(nodes, "Add a photo");
  assert(stillThere, "the photo screen did not survive the refusal");
  assert(fatal.length === 0, `the refusal produced ${fatal.length} error line(s): ${fatal[0]?.slice(0, 180)}`);
  const apology = nodes.filter((n) => /denied|failed|error|permission required|try again/i.test(n.text || n.desc));
  assert(apology.length === 0, `the screen apologised: ${apology.map((n) => n.text).join(", ")}`);

  return sawDialog
    ? "permission dialog shown and DENIED; the screen stayed put, said nothing, and logged nothing"
    : "no dialog appeared (the picker resolved without asking); the screen stayed put and logged nothing";
});

// ─────────────────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
console.log("\n" + "=".repeat(64));
console.log(`  ${results.length - failed.length}/${results.length} device checks passed`);
console.log(`  evidence: ${EVIDENCE}`);
console.log("=".repeat(64) + "\n");
if (failed.length) process.exit(1);
