import type { ViewInstance } from "react-native";
import { useCertificate } from "@/hooks/useCertificate";
import type { ElementRef } from "react";
import { useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { AppButton } from "@/components/common/AppButton";
import type { ScreenProps } from "@/navigation/types";
import {
  copyCertificateLink,
  shareCertificateLink,
  shareCertificatePdf,
  shareCertificatePng,
  shareIssuedCertificatePng,
} from "../certificateShare";
import { PdfPreview } from "../PdfPreview";
import { Card, LoadState, Message, Screen, useLmsStyles } from "../ui";
export function CertificateScreen({ route }: ScreenProps<"LmsCertificate">) {
  const styles = useLmsStyles();
  const resource = useCertificate(route.params.certificateId);
  const cert = resource.data;
  const preview = useRef<ElementRef<typeof View>>(null);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sharing failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title="Your certificate">
      <LoadState {...resource} retry={resource.refresh} />
      {cert ? (
        <>
          <View
            ref={preview}
            collapsable={false}
            style={{
              backgroundColor: "#fff",
              padding: 28,
              borderWidth: 4,
              borderColor: "#443388",
              gap: 16,
            }}
          >
            <Text
              style={{ color: "#443388", textAlign: "center", fontSize: 16 }}
            >
              THINKZ AI
            </Text>
            <Text style={{ color: "#222", textAlign: "center", fontSize: 24 }}>
              Certificate of Completion
            </Text>
            <Text style={{ color: "#222", textAlign: "center", fontSize: 20 }}>
              {cert.studentName}
            </Text>
            <Text style={{ color: "#222", textAlign: "center", fontSize: 17 }}>
              {cert.courseName}
            </Text>
            <Text style={{ color: "#555", textAlign: "center" }}>
              Issued {new Date(cert.issuedAt).toLocaleDateString()}
            </Text>
            <Text style={{ color: "#555", textAlign: "center", fontSize: 10 }}>
              {cert.certificateNo}
            </Text>
          </View>
          <Card>
            {cert.storage === "local" ? <Message text="Saved on this laptop. Email delivery is not enabled for this local preview." /> : null}
            <Text style={styles.heading}>PDF preview</Text>
            {document.url ? <PdfPreview key={cert.id} url={document.url} onPng={cert.enrollmentId ? uri => setIssuedPng({ owner: cert, uri }) : undefined} /> : <Message text={document.error || 'Loading authenticated PDF preview…'} />}
            <Message text="If your Android PDF preview is unavailable, use Save / share PDF to open it in your PDF viewer." />
            <AppButton
              title="Save / share PDF"
              loading={busy}
              onPress={() => void action(() => shareCertificatePdf(cert))}
            />
            <AppButton
              title="Share certificate link"
              variant="secondary"
              disabled={busy}
              onPress={() => void action(() => shareCertificateLink(cert))}
            />
            <AppButton
              title="Copy link"
              variant="secondary"
              disabled={busy}
              onPress={() =>
                void action(async () => {
                  await copyCertificateLink(cert);
                  setMessage("Certificate link copied.");
                })
              }
            />
            <AppButton
              title="Share PNG preview"
              variant="secondary"
              disabled={busy || (cert.enrollmentId ? issuedPng?.owner !== cert : Platform.OS === 'web')}
              onPress={() =>
                void action(async () => {
                  if (cert.enrollmentId) {
                    if (issuedPng?.owner !== cert) throw new Error('Wait for the issued PDF preview to load.');
                    await shareIssuedCertificatePng(issuedPng.uri, cert.id); return;
                  }
                  const uri = await captureRef(preview, {
                    format: "png",
                    quality: 1,
                  });
                  await shareCertificatePng(uri);
                })
              }
            />
          </Card>
          {message ? <Message text={message} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
