export function HostedVideo({ url }: { url: string }) {
  return <iframe title="Lesson video player" src={url} allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin" style={{ width: '100%', height: 230, backgroundColor: '#000', border: 0 }} />;
}
