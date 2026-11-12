import { pdfPreviewHtml } from "./pdfPreviewHtml";
import { useEffect, useRef } from 'react';
import { isCertificatePng } from './certificatePng';
export function PdfPreview({ url, onPng }: { url: string; onPng?: (uri: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow && event.data?.type === 'certificatePng' && isCertificatePng(event.data.dataUrl)) onPng?.(event.data.dataUrl);
    };
    window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
  }, [onPng]);
  return (
    <iframe
      ref={frame}
      srcDoc={pdfPreviewHtml(url, !!onPng)}
      title="Certificate PDF preview"
      sandbox="allow-scripts"
      style={{ height: 320, width: "100%", border: 0 }}
    />
  );
}
