// ============================================================
// FILE: index.js — the app's entry point.
//
// WHY THIS FILE EXISTS, because "add an index.js" is otherwise cargo cult.
//
// `package.json` used to point `main` at `node_modules/expo/AppEntry.js`, the
// legacy Expo entry, whose entire body is:
//
//     import App from '../../App';
//     registerRootComponent(App);
//
// That relative path assumes a FLAT `node_modules`, where `node_modules/expo/`
// is two levels below the project root. This repository installs with pnpm, so
// `node_modules/expo` is a symlink into `node_modules/.pnpm/expo@54.../`, and
// `../../App` resolves inside the pnpm store — where no `App.tsx` exists.
//
// The consequence was total and had never been observed, because nothing in
// this repository had ever run Metro: `harness/` uses Vite, `tests/` uses
// Node's own runner, and both deliberately bypass the app's entry point.
//
//     Android Bundling failed 15822ms .../expo/AppEntry.js (1 module)
//     Unable to resolve "../../App"
//
// So the app could not be bundled AT ALL — not on a device, not in a simulator,
// not by `expo start`. Found by trying to run it on Android for the first time.
//
// `registerRootComponent` is the same call `AppEntry.js` makes; the only change
// is that the import is resolved from the project root, where `App.tsx` is.
// This is Expo's own documented entry point and is what a template ships today.
// ============================================================

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
