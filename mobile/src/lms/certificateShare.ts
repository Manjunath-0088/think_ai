import { Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import type { Certificate } from "./types";
import { certificatePdfBytes } from './certificateTransport';
import { isCertificatePng } from './certificatePng';
export function certificateLink(certificate: Certificate) {
  if (certificate.enrollmentId && certificate.verificationUrl) return certificate.verificationUrl;
  const base = process.env.EXPO_PUBLIC_APP_URL;
  return base
    ? `${base.replace(/\/$/, "")}/learner/certificates/${certificate.id}`
    : `thinkzai://learner/certificates/${certificate.id}`;
}
export async function copyCertificateLink(certificate: Certificate) {
  await Clipboard.setStringAsync(certificateLink(certificate));
}
export async function shareCertificateLink(certificate: Certificate) {
  return Share.share({
    title: "Course certificate",
    message: `${certificate.courseName}: ${certificateLink(certificate)}`,
  });
}
export async function shareCertificatePdf(certificate: Certificate) {
  if (certificate.enrollmentId) {
    const bytes = await certificatePdfBytes(certificate);
    if (Platform.OS === 'web') {
      const binary = atob(bytes);
      const blob = new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: 'application/pdf' });
      const target = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = target;
      link.download = `certificate-${certificate.id}.pdf`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(target), 60000); return;
    }
    if (!FileSystem.cacheDirectory) throw new Error('Device file storage is unavailable.');
    const target = `${FileSystem.cacheDirectory}certificate-${certificate.id}-${Date.now()}.pdf`;
    await FileSystem.writeAsStringAsync(target, bytes, { encoding: FileSystem.EncodingType.Base64 });
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is unavailable on this device.');
      await Sharing.shareAsync(target, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Save or share certificate' });
    } finally { await FileSystem.deleteAsync(target, { idempotent: true }); }
    return;
  }
  if (Platform.OS === "web") {
    const link = document.createElement("a");
    link.href = certificate.pdfUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
    return;
  }
  if (!FileSystem.cacheDirectory)
    throw new Error("Device file storage is unavailable.");
  const target = `${FileSystem.cacheDirectory}certificate-${certificate.id}.pdf`;
  const result = await FileSystem.downloadAsync(certificate.pdfUrl, target);
  if (result.status !== 200)
    throw new Error(
      "Download link expired. Refresh the certificate and retry.",
    );
  if (Platform.OS === "ios") {
    return Share.share(
      { url: target, title: "Course certificate" },
      { subject: `${certificate.courseName} certificate` },
    );
  }
  // Android core Share supports text only; Expo Sharing supplies a content URI.
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is not available on this device.");
  await Sharing.shareAsync(target, {
    mimeType: "application/pdf",
    UTI: "com.adobe.pdf",
    dialogTitle: "Save or share certificate",
  });
}
export async function shareCertificatePng(uri: string) {
  if (Platform.OS === "web")
    throw new Error("PNG sharing is available in the Android and iOS app.");
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Image sharing is not available on this device.");
  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    UTI: "public.png",
    dialogTitle: "Share certificate preview",
  });
}
export async function shareIssuedCertificatePng(uri: string, certificateId: number) {
  if (!isCertificatePng(uri)) throw new Error('The issued certificate image is not ready. Wait for the PDF preview and retry.');
  if (Platform.OS === 'web') {
    const bytes = Uint8Array.from(atob(uri.slice('data:image/png;base64,'.length)), c => c.charCodeAt(0));
    const target = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    const link = document.createElement('a'); link.href = target; link.download = `certificate-${certificateId}.png`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(target), 60000); return;
  }
  if (!FileSystem.cacheDirectory) throw new Error('Device file storage is unavailable.');
  const target = `${FileSystem.cacheDirectory}certificate-${certificateId}-${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(target, uri.slice('data:image/png;base64,'.length), { encoding: FileSystem.EncodingType.Base64 });
  try { await shareCertificatePng(target); }
  finally { await FileSystem.deleteAsync(target, { idempotent: true }); }
}
