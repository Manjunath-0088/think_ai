import { View } from "react-native";
import { WebView } from "react-native-webview";
import { pdfPreviewHtml } from "./pdfPreviewHtml";
import { isCertificatePng } from './certificatePng';
export function PdfPreview({ url, onPng }: { url: string; onPng?: (uri: string) => void }) {
  return (
    <View style={{ height: 260 }}>
      <WebView<{}>
        source={{ html: pdfPreviewHtml(url) }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={(r) => r.url === "about:blank"}
        accessibilityLabel="Certificate PDF preview"
      />
    </View>
  );
}
