// ============================================================
// FILE: device/adb.mjs — the device, as a small set of verbs.
//
// Everything here talks to a REAL Android runtime over adb. No react-native-web,
// no jsdom, no shim: the pixels are drawn by Android's own compositor, the text
// is laid out by Android's own font engine, and the insets are the ones the
// window manager actually hands the app.
//
// WRITTEN IN NODE RATHER THAN SHELL for a specific reason. Git Bash rewrites a
// leading `/sdcard/...` into `C:/Program Files/Git/sdcard/...` on its way to
// adb, so `uiautomator dump /sdcard/ui.xml` silently wrote to a path that does
// not exist on the device and reported success. Node's `spawnSync` passes
// argv through untouched.
// ============================================================

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ADB =
  process.env.ADB ??
  join(process.env.LOCALAPPDATA ?? "", "Android", "Sdk", "platform-tools", "adb.exe");

if (!existsSync(ADB)) {
  throw new Error(`adb not found at ${ADB}. Set ADB=<path> or install platform-tools.`);
}

function raw(args, encoding = "utf8") {
  const r = spawnSync(ADB, args, { encoding, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  return r;
}

export const adb = (...args) => raw(args).stdout.replace(/\r/g, "").trim();
export const shell = (...args) => adb("shell", ...args);

/** A PNG of what is on screen right now, as a Buffer. */
export function screencap() {
  const r = raw(["exec-out", "screencap", "-p"], "buffer");
  return r.stdout;
}

/**
 * Raw framebuffer pixels, so a colour can be MEASURED rather than eyeballed.
 *
 * `screencap` without `-p` emits a small header (width, height, format, and on
 * modern Android a colour-space word) followed by RGBA rows. Reading it
 * directly avoids decoding a PNG, and more importantly avoids any library
 * silently colour-managing the values on the way in — which would make a
 * gradient-stop comparison a statement about the decoder.
 */
export function framebuffer() {
  const buf = raw(["exec-out", "screencap"], "buffer").stdout;
  const width = buf.readUInt32LE(0);
  const height = buf.readUInt32LE(4);
  const format = buf.readUInt32LE(8);
  // Header is 12 bytes on older releases and 16 once a colour space was added.
  // Derive it from the length instead of assuming, because assuming shifts
  // every pixel by one channel and produces plausible-looking wrong colours.
  const offset = buf.length - width * height * 4;
  if (offset !== 12 && offset !== 16) {
    throw new Error(`unexpected screencap header: ${offset} bytes for ${width}x${height}`);
  }
  return {
    width,
    height,
    format,
    /** RGBA at a device pixel. */
    at(x, y) {
      const i = offset + (y * width + x) * 4;
      return { r: buf[i], g: buf[i + 1], b: buf[i + 2], a: buf[i + 3] };
    },
  };
}

export const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

/**
 * The live view tree, with REAL on-device bounds in device pixels.
 *
 * This is the measurement that the web harness cannot make at all. A
 * `react-native-web` baseline is a statement about a CSS layout; these
 * rectangles are where Android put the views, after its own font metrics, its
 * own density rounding and its own inset handling.
 */
export function dump() {
  // Write, then read back with `cat`. `uiautomator dump /dev/tty` interleaves
  // with the tool's own progress line and produces invalid XML about one run
  // in five.
  let out = "";
  let xml = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    out = shell("uiautomator", "dump", "/sdcard/rc-ui.xml");
    if (/dumped to/.test(out)) {
      xml = shell("cat", "/sdcard/rc-ui.xml");
      if (xml.includes("<node")) break;
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 350);
  }
  if (!/dumped to/.test(out)) throw new Error(`uiautomator dump failed: ${out}`);

  const nodes = [];
  const re = /<node([^>]*)\/?>/g;
  let m;
  while ((m = re.exec(xml))) {
    const attrs = {};
    const ar = /([\w-]+)="([^"]*)"/g;
    let a;
    while ((a = ar.exec(m[1]))) attrs[a[1]] = a[2];
    const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(attrs.bounds ?? "");
    if (!b) continue;
    const [x1, y1, x2, y2] = b.slice(1).map(Number);
    nodes.push({
      text: attrs.text ?? "",
      desc: attrs["content-desc"] ?? "",
      cls: attrs.class ?? "",
      clickable: attrs.clickable === "true",
      x1, y1, x2, y2,
      w: x2 - x1,
      h: y2 - y1,
      cx: Math.round((x1 + x2) / 2),
      cy: Math.round((y1 + y2) / 2),
    });
  }
  if (nodes.length === 0) throw new Error("uiautomator returned no nodes — is the app foregrounded?");
  return nodes;
}

/** First node whose text or content-desc contains `needle` (case-insensitive). */
export function find(nodes, needle) {
  const n = needle.toLowerCase();
  return nodes.find((v) => v.text.toLowerCase().includes(n) || v.desc.toLowerCase().includes(n));
}

export function tap(x, y) {
  shell("input", "tap", String(x), String(y));
}

export const tapNode = (node) => tap(node.cx, node.cy);

export function typeText(text) {
  // `input text` uses spaces as argument separators and eats them.
  shell("input", "text", text.replace(/ /g, "%s"));
}

/**
 * Block for `ms`. Synchronous on purpose: every other verb in this file is
 * synchronous `spawnSync`, and mixing in an async sleep would mean the timing
 * measurements in `check.mjs` were partly a statement about the event loop.
 */
export function sleep(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    /* spin */
  }
}

/** Poll until `fn()` returns truthy, or throw. Returns elapsed ms. */
export function waitFor(label, fn, { timeoutMs = 15_000, everyMs = 250 } = {}) {
  const started = Date.now();
  for (;;) {
    let value;
    try {
      value = fn();
    } catch {
      value = null;
    }
    if (value) return { value, ms: Date.now() - started };
    if (Date.now() - started > timeoutMs) throw new Error(`timed out waiting for ${label}`);
    // Busy-wait deliberately: `adb shell` round trips are ~40-80ms, so the poll
    // is already paced by the transport, and an async sleep here would make the
    // measured latencies in `check.mjs` a statement about the sleep.
    const until = Date.now() + everyMs;
    while (Date.now() < until) {
      /* spin */
    }
  }
}

/**
 * The window insets Android is actually reporting, in device pixels.
 *
 * NOT computed from the screen size. The status bar, the gesture bar and the
 * display cutout are separate insets and a device can have all three, which is
 * the whole reason `react-native-safe-area-context` exists and the whole reason
 * a web harness cannot make a claim about it.
 */
export function insets() {
  const out = shell("dumpsys", "window", "displays");

  // Read the InsetsSource FRAMES, which are the authoritative rectangles the
  // window manager publishes. The first version of this scraped
  // `Insets{...top=N}` out of a nearby `mInsetsHint`, and that returned 0 for
  // the status bar on one run and 0 for the nav bar on the next, from the same
  // device in the same state — because `.*?` crossed into whichever hint block
  // happened to come first. A measurement that quietly returns zero is worse
  // than one that fails: "no inset" is a plausible answer that passes.
  const source = (type) => {
    const m = new RegExp(`InsetsSource[^\\n]*type=${type} frame=\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]`).exec(out);
    if (!m) return null;
    const [x1, y1, x2, y2] = m.slice(1).map(Number);
    return { x1, y1, x2, y2, h: y2 - y1 };
  };

  const status = source("statusBars");
  const nav = source("navigationBars");
  const cutout = source("displayCutout");
  if (!status || !nav) throw new Error("could not read statusBars/navigationBars insets from dumpsys");

  return {
    /** Height of the status-bar inset at the top, in device pixels. */
    statusBar: status.h,
    /** Height of the gesture/navigation inset at the bottom. */
    navBar: nav.h,
    /** The y at which the bottom inset begins — content below this is covered. */
    navTop: nav.y1,
    cutout,
  };
}

export const density = () => Number(/(\d+)/.exec(shell("wm", "density").split(":").pop())[1]);
export function screenSize() {
  const m = /(\d+)x(\d+)/.exec(shell("wm", "size").split(":").pop());
  return { w: Number(m[1]), h: Number(m[2]) };
}
