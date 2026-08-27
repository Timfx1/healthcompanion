import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { ReportData, buildReportHtml } from "./reportHtml";

// Turns the recovery report into a PDF and hands it to the OS share sheet.
//
// Privacy: the PDF is rendered on the device and shared through the system
// sheet. Nothing is uploaded anywhere and no network call belongs in this file —
// the user decides where their health summary goes.

export async function exportRecoveryReport(data: ReportData): Promise<void> {
  const html = buildReportHtml(data);

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (!(await Sharing.isAvailableAsync())) {
    // Rare (mostly simulators), and worth saying plainly rather than failing silently.
    throw new Error("Sharing is not available on this device, so the PDF could not be opened.");
  }

  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Share your Healthcompanion report"
  });

  if (__DEV__) {
    console.log("[RecoveryCompanion/Report] PDF exported", { platform: Platform.OS, uri });
  }
}
