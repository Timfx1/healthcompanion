#!/usr/bin/env node
/**
 * Bumps the marketing version (expo.version in app.json, mirrored to
 * package.json) using an odometer scheme: the minor and patch segments each cap
 * at 9 and roll into the next segment.
 *
 *   1.0.1 -> 1.0.2 -> ... -> 1.0.9 -> 1.1.0 -> ... -> 1.9.9 -> 2.0.0
 *
 * EAS `autoIncrement` only manages the developer-facing build number
 * (ios.buildNumber / android.versionCode); it cannot touch the marketing
 * version. Run this before every production build (see the `release` npm
 * script) so the App Store / Play version always increases.
 */
const fs = require("fs");
const path = require("path");

const appJsonPath = path.join(__dirname, "..", "app.json");
const pkgJsonPath = path.join(__dirname, "..", "package.json");

function bump(version) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n) || n < 0)) {
    throw new Error(`Cannot bump non-numeric version "${version}". Expected MAJOR.MINOR.PATCH.`);
  }
  let [major, minor, patch] = parts;
  patch += 1;
  if (patch > 9) {
    patch = 0;
    minor += 1;
  }
  if (minor > 9) {
    minor = 0;
    major += 1;
  }
  return `${major}.${minor}.${patch}`;
}

const appConfig = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
const current = appConfig.expo.version;
const next = bump(current);

appConfig.expo.version = next;
fs.writeFileSync(appJsonPath, `${JSON.stringify(appConfig, null, 2)}\n`);

const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
pkg.version = next;
fs.writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Bumped app version ${current} -> ${next}`);
