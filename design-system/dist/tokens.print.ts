// GENERATED FILE — DO NOT EDIT.
// Source: design-system/tokens/*.json
// Rebuild: node design-system/build/build.mjs
// Verify:  node design-system/build/build.mjs --check
//
// The doctor report on PAPER. Single-valued: there is no mode argument
// here and there should never be one. See tokens/print.json for why, and
// checks/pairs.manifest.json for the print-* usage classes these are measured
// against (7:1 body copy, not 4.5:1 — paper offers no brightness control, no
// zoom, no theme fallback, and is routinely photocopied).

export const printTokens = {
  "paper": {
    "sheet": "#FFFFFF",
    "tint": "#F7F6FB",
    "band": "#EFEDF7"
  },
  "ink": {
    "primary": "#1A1830",
    "secondary": "#4E4C69"
  },
  "accent": {
    "ink": "#4F4783",
    "stroke": "#7C6FCD",
    "tint": "#F0EDFB"
  },
  "rule": {
    "strong": "#6B6890",
    "hairline": "#E4E1F5"
  },
  "trend": {
    "improving": {
      "ink": "#285B39",
      "band": "#EAF3ED"
    },
    "worsening": {
      "ink": "#843456",
      "band": "#F7EDF1"
    },
    "steady": {
      "ink": "#4E4C69",
      "band": "#EFEDF7"
    }
  },
  "painDots": {
    "filled": "#1A1830",
    "track": "#DEDBEE"
  }
} as const;

export type PrintTokens = typeof printTokens;
