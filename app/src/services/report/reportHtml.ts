import { PainEntry, ExerciseCompletion, TrackerCheckIn } from "../../state/AppDataContext";
import { trackerConfigs } from "../../data/trackerCheckIns";
import { exercises } from "../../data/mockRecoveryPlan";
import { HIGHER_IS_BETTER, Insight, TRACKER_ORDER, daysTracked } from "../../utils/recoveryInsights";

// Builds the printable recovery report as a single self-contained HTML string.
// Pure: no React, no file system, no network — so it can be opened straight in a
// browser while iterating. `exportReport.ts` turns the output into a PDF.
//
// Print layout note: WebKit does not reliably honour `@page` margins here, which
// is why the page is `margin: 0` with the padding applied to a wrapper instead.
// The footer is fixed to repeat on every page, so `.sheet` reserves matching
// bottom padding — without it the disclaimer prints on top of the last section.

export type ReportData = {
  displayName: string;
  injuryType?: string;
  phaseLabel: string;
  painEntries: PainEntry[];
  trackerCheckIns: TrackerCheckIn[];
  exerciseCompletions: ExerciseCompletion[];
  completedExerciseIds: string[];
  insights: Insight[];
};

/** HTML-escape every value that comes from user input or stored data. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * The AnklePath app icon, redrawn as inline SVG: the teal ring on the dark
 * rounded square. Inline rather than embedding assets/icon.png, which would need
 * expo-file-system + expo-asset and base64 reading; this stays crisp at print
 * resolution with no extra dependencies.
 */
const LOGO_SVG = `
<svg class="logo" width="34" height="34" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="64" height="64" rx="15" fill="#0E1E32"/>
  <ellipse cx="32" cy="32.5" rx="16.5" ry="20.5" fill="none" stroke="#3DD2C0" stroke-width="9"/>
</svg>`;

/** Ten dots, the first `score` filled. Reads severity without doing arithmetic. */
function painDots(score: number): string {
  const filled = Math.round(Math.max(0, Math.min(10, score)));
  let dots = "";
  for (let index = 0; index < 10; index += 1) {
    dots += `<span class="dot${index < filled ? " dot--on" : ""}"></span>`;
  }
  return `<div class="dots">${dots}</div>`;
}

/**
 * Pain over time. Renders even with a single check-in — a dashed baseline with
 * one marker is an honest picture of "one data point so far", where the old
 * version silently drew nothing and left the heading promising a chart that
 * never appeared.
 */
function painChartSvg(entries: PainEntry[]): string {
  if (entries.length === 0) return "";

  const width = 660;
  const height = 150;
  const pad = { top: 12, right: 14, bottom: 22, left: 26 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const points = entries.map((entry, index) => ({
    x: pad.left + (entries.length === 1 ? plotW / 2 : (index / (entries.length - 1)) * plotW),
    y: pad.top + (1 - entry.pain / 10) * plotH,
    entry
  }));

  const grid = [0, 5, 10]
    .map((value) => {
      const y = pad.top + (1 - value / 10) * plotH;
      return `<line x1="${pad.left}" y1="${round1(y)}" x2="${width - pad.right}" y2="${round1(y)}" stroke="#E4EAF1" stroke-width="1"/>
        <text x="${pad.left - 7}" y="${round1(y) + 3.5}" text-anchor="end" font-size="9" fill="#93A3B4">${value}</text>`;
    })
    .join("");

  // One point: show where the scale sits rather than pretending there is a trend.
  const line =
    entries.length === 1
      ? `<line x1="${pad.left}" y1="${round1(points[0].y)}" x2="${width - pad.right}" y2="${round1(points[0].y)}"
           stroke="#C8D4E0" stroke-width="1.5" stroke-dasharray="4 4"/>`
      : `<path d="${points.map((p, i) => `${i === 0 ? "M" : "L"}${round1(p.x)},${round1(p.y)}`).join(" ")}"
           fill="none" stroke="#1D6FB8" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;

  const dots = points
    .map((p) => `<circle cx="${round1(p.x)}" cy="${round1(p.y)}" r="3.4" fill="#1D6FB8" stroke="#FFFFFF" stroke-width="1.5"/>`)
    .join("");

  const caption =
    entries.length === 1
      ? `<text x="${width - pad.right}" y="${height - 5}" text-anchor="end" font-size="9" fill="#93A3B4">One check-in so far</text>`
      : `<text x="${pad.left}" y="${height - 5}" font-size="9" fill="#93A3B4">${escapeHtml(formatShortDate(entries[0].createdAt))}</text>
         <text x="${width - pad.right}" y="${height - 5}" text-anchor="end" font-size="9" fill="#93A3B4">${escapeHtml(
           formatShortDate(entries[entries.length - 1].createdAt)
         )}</text>`;

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pain over time">
    ${grid}${line}${dots}${caption}
  </svg>`;
}

/** Adherence as a ring — a proportion reads faster as an arc than as a sentence. */
function adherenceRing(done: number, total: number): string {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? Math.min(1, done / total) : 0;
  const filled = round1(percent * circumference);

  return `<svg width="74" height="74" viewBox="0 0 74 74" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${done} of ${total} exercises complete">
    <circle cx="37" cy="37" r="${radius}" fill="none" stroke="#E4EAF1" stroke-width="8"/>
    <circle cx="37" cy="37" r="${radius}" fill="none" stroke="#17A08C" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${filled} ${round1(circumference)}" transform="rotate(-90 37 37)"/>
    <text x="37" y="41" text-anchor="middle" font-size="15" font-weight="700" fill="#132434">${done}/${total}</text>
  </svg>`;
}

function buildInsights(insights: Insight[]): string {
  if (insights.length === 0) {
    return `<p class="empty">Not enough check-ins yet to draw out trends. Keep logging and this fills in.</p>`;
  }
  return insights
    .map(
      (insight) => `
      <div class="callout callout--${insight.tone}">
        <span class="callout__head">${escapeHtml(insight.headline)}</span>
        <span class="callout__body">${escapeHtml(insight.detail)}</span>
      </div>`
    )
    .join("");
}

function buildTrackerRows(checkIns: TrackerCheckIn[]): string {
  const rows = TRACKER_ORDER.map((key) => {
    const entries = checkIns.filter((entry) => entry.key === key);
    if (entries.length === 0) return "";

    const latest = entries[0]; // newest first
    const earliest = entries[entries.length - 1];
    const delta = latest.value - earliest.value;
    const improving = HIGHER_IS_BETTER[key] ? delta > 0 : delta < 0;
    const label = entries.length < 2 || delta === 0 ? "Steady" : improving ? "Improving" : "Watch";
    const tone = label === "Improving" ? "good" : label === "Watch" ? "warn" : "flat";

    return `<li class="measure">
      <div class="measure__copy">
        <span class="measure__name">${escapeHtml(trackerConfigs[key].title)}</span>
        <span class="measure__value">${escapeHtml(latest.label)}</span>
      </div>
      <span class="pill pill--${tone}">${label}</span>
    </li>`;
  })
    .filter(Boolean)
    .join("");

  return rows ? `<ul class="measures">${rows}</ul>` : `<p class="empty">No mobility check-ins yet.</p>`;
}

function buildPainRows(entries: PainEntry[]): string {
  if (entries.length === 0) return "";

  const rows = entries
    .slice(0, 12)
    .map(
      (entry) => `<tr>
        <td class="num">${escapeHtml(formatShortDate(entry.createdAt))}</td>
        <td class="num"><b>${entry.pain}</b><span class="of">/10</span></td>
        <td>${escapeHtml(entry.location)}</td>
        <td class="muted">${escapeHtml(entry.symptoms.join(", ") || "—")}</td>
      </tr>`
    )
    .join("");

  const more = entries.length > 12 ? `<p class="empty">Showing the 12 most recent of ${entries.length} check-ins.</p>` : "";

  return `<table>
      <thead><tr><th>Date</th><th>Pain</th><th>Location</th><th>Symptoms</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>${more}`;
}

export function buildReportHtml(data: ReportData, now = new Date()): string {
  const { painEntries, trackerCheckIns, completedExerciseIds, insights } = data;

  const painChrono = [...painEntries].reverse(); // oldest -> newest, for the chart
  const totalCheckIns = painEntries.length + trackerCheckIns.length;
  const tracked = daysTracked(painEntries, trackerCheckIns, now.getTime());
  const averagePain = painEntries.length
    ? round1(painEntries.reduce((sum, entry) => sum + entry.pain, 0) / painEntries.length)
    : undefined;

  const stamps = [...painEntries, ...trackerCheckIns].map((entry) => new Date(entry.createdAt).getTime());
  const rangeLabel = stamps.length
    ? `${formatDate(new Date(Math.min(...stamps)).toISOString())} – ${formatDate(new Date(Math.max(...stamps)).toISOString())}`
    : "No check-ins yet";

  const doneCount = completedExerciseIds.filter((id) => exercises.some((exercise) => exercise.id === id)).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>AnklePath recovery report</title>
<style>
  /* WebKit ignores @page margins here, so the sheet carries the padding. */
  @page { size: A4; margin: 0; }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: #FFFFFF;
    color: #132434;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Bottom padding reserves room for the fixed footer on every page. */
  .sheet { padding: 15mm 14mm 26mm; }

  /* ---------- masthead ---------- */
  .masthead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12mm;
    padding-bottom: 3.5mm;
    border-bottom: 2px solid #1D6FB8;
  }
  .brand { display: flex; align-items: center; gap: 3mm; }
  .logo { display: block; flex: 0 0 auto; }
  .brand__name {
    font-size: 19pt;
    font-weight: 800;
    letter-spacing: -0.4pt;
    line-height: 1.1;
    color: #1D6FB8;
  }
  .brand__tag { font-size: 7.5pt; color: #7C8CA0; letter-spacing: .2pt; }
  .masthead__right { text-align: right; }
  .masthead__title { font-size: 11pt; font-weight: 700; }
  .masthead__date { font-size: 8.5pt; color: #7C8CA0; }

  /* ---------- identity ---------- */
  .identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8mm;
    margin-top: 4mm;
  }
  .identity__who { font-size: 12pt; font-weight: 700; }
  .identity__meta { font-size: 8.5pt; color: #7C8CA0; margin-top: .6mm; }
  .phasepill {
    flex: 0 0 auto;
    background: #E8F4F1;
    color: #0F7A69;
    border-radius: 100px;
    padding: 1.6mm 4mm;
    font-size: 8.5pt;
    font-weight: 700;
    white-space: nowrap;
  }

  /* ---------- stats ---------- */
  .stats { display: flex; gap: 3.5mm; margin-top: 5mm; }
  .stat {
    flex: 1;
    border: 1px solid #E4EAF1;
    border-radius: 3mm;
    padding: 3.5mm 4mm;
    background: #FBFCFD;
  }
  .stat--pain { background: #FDF3EF; border-color: #F3D9CD; }
  .stat__value { font-size: 21pt; font-weight: 800; line-height: 1; letter-spacing: -0.6pt; }
  .stat__value .of { font-size: 11pt; font-weight: 600; color: #93A3B4; }
  .stat__label {
    font-size: 7pt;
    letter-spacing: .8pt;
    text-transform: uppercase;
    color: #7C8CA0;
    font-weight: 700;
    margin-top: 1.4mm;
  }
  .dots { display: flex; gap: 1.1mm; margin-top: 2.4mm; }
  .dot { width: 2.4mm; height: 2.4mm; border-radius: 50%; background: #EFDCD3; }
  .dot--on { background: #C9542A; }

  /* ---------- sections ---------- */
  section { margin-top: 6mm; page-break-inside: avoid; }
  h2 {
    font-size: 10.5pt;
    font-weight: 750;
    margin: 0 0 2.5mm;
    padding-left: 2.4mm;
    border-left: 2.5pt solid #17A08C;
    line-height: 1.25;
  }
  .empty { font-size: 8.5pt; color: #7C8CA0; margin: 1.5mm 0 0; }

  .callout {
    border: 1px solid #E4EAF1;
    border-left: 2.5pt solid #1D6FB8;
    border-radius: 2mm;
    padding: 2.6mm 3.4mm;
    margin-bottom: 2mm;
    background: #FBFCFD;
  }
  .callout--good { border-left-color: #17A08C; }
  .callout--bad { border-left-color: #C9542A; }
  .callout__head { display: block; font-weight: 700; font-size: 9.5pt; }
  .callout__body { display: block; font-size: 8.5pt; color: #61738A; margin-top: .5mm; }

  /* ---------- two-column base ---------- */
  .cols { display: flex; gap: 6mm; margin-top: 6mm; align-items: flex-start; }
  .cols > * { flex: 1; margin-top: 0; }
  .col--narrow { flex: 0 0 46mm; }

  .measures { list-style: none; margin: 0; padding: 0; }
  .measure {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 3mm;
    padding: 2mm 0;
    border-bottom: 1px solid #EEF2F6;
  }
  .measure:last-child { border-bottom: 0; }
  .measure__name { display: block; font-size: 9pt; font-weight: 650; }
  .measure__value { display: block; font-size: 8.5pt; color: #7C8CA0; }
  .pill {
    flex: 0 0 auto;
    border-radius: 100px;
    padding: .8mm 2.6mm;
    font-size: 7.5pt;
    font-weight: 700;
  }
  .pill--good { background: #E4F3EC; color: #17805F; }
  .pill--warn { background: #FBEADF; color: #B4551F; }
  .pill--flat { background: #EFF3F7; color: #7C8CA0; }

  .ring { display: flex; flex-direction: column; align-items: center; gap: 2mm; }
  .ring__label { font-size: 8pt; color: #7C8CA0; text-align: center; }

  /* ---------- table ---------- */
  table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 2mm; }
  th {
    text-align: left;
    font-size: 7pt;
    letter-spacing: .7pt;
    text-transform: uppercase;
    color: #93A3B4;
    font-weight: 700;
    padding: 0 2.5mm 1.4mm 0;
    border-bottom: 1px solid #E4EAF1;
  }
  td { padding: 1.7mm 2.5mm 1.7mm 0; border-bottom: 1px solid #F2F5F8; }
  td.num { font-variant-numeric: tabular-nums; }
  td .of { color: #93A3B4; font-size: 8pt; }
  td.muted { color: #7C8CA0; }

  /* ---------- footer, repeated every page ---------- */
  .footer {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    padding: 3mm 14mm 4mm;
    border-top: 1px solid #E4EAF1;
    background: #FFFFFF;
    font-size: 7pt;
    line-height: 1.45;
    color: #8B9AAB;
  }
  .footer b { color: #61738A; }
</style>
</head>
<body>
<div class="sheet">

  <header class="masthead">
    <div class="brand">
      ${LOGO_SVG}
      <div>
        <div class="brand__name">AnklePath</div>
        <div class="brand__tag">Ankle injury recovery tracking</div>
      </div>
    </div>
    <div class="masthead__right">
      <div class="masthead__title">Recovery report</div>
      <div class="masthead__date">${escapeHtml(formatDate(now.toISOString()))}</div>
    </div>
  </header>

  <div class="identity">
    <div>
      <div class="identity__who">${escapeHtml(data.displayName)}</div>
      <div class="identity__meta">
        ${data.injuryType ? escapeHtml(data.injuryType) + " &nbsp;·&nbsp; " : ""}${escapeHtml(rangeLabel)}
      </div>
    </div>
    <div class="phasepill">${escapeHtml(data.phaseLabel)}</div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat__value">${tracked}</div>
      <div class="stat__label">${tracked === 1 ? "Day tracked" : "Days tracked"}</div>
    </div>
    <div class="stat">
      <div class="stat__value">${totalCheckIns}</div>
      <div class="stat__label">Check-ins</div>
    </div>
    <div class="stat stat--pain">
      <div class="stat__value">${averagePain !== undefined ? averagePain : "—"}<span class="of">${
        averagePain !== undefined ? "/10" : ""
      }</span></div>
      <div class="stat__label">Average pain</div>
      ${averagePain !== undefined ? painDots(averagePain) : ""}
    </div>
  </div>

  <section>
    <h2>Insights</h2>
    ${buildInsights(insights)}
  </section>

  <section>
    <h2>Pain over time</h2>
    ${painChartSvg(painChrono)}
    ${buildPainRows(painEntries)}
  </section>

  <div class="cols">
    <section>
      <h2>Mobility &amp; strength</h2>
      ${buildTrackerRows(trackerCheckIns)}
    </section>
    <section class="col--narrow">
      <h2>Adherence</h2>
      <div class="ring">
        ${adherenceRing(doneCount, exercises.length)}
        <div class="ring__label">exercises completed<br />in the daily plan</div>
      </div>
    </section>
  </div>

</div>

<footer class="footer">
  <b>This summary is for your own tracking and education — it is not a medical assessment. Share it with a
  clinician if you have concerns.</b>
  AnklePath is not a medical device and does not diagnose, treat, or provide clinical advice. Nothing in this
  report should be read as clearance to return to sport or activity.
  Generated by AnklePath on ${escapeHtml(formatDate(now.toISOString()))}.
</footer>

</body>
</html>`;
}
