import "./globals.css";

export const metadata = {
  title: "AI Bridge Georgia — 풀스택 개발 & 광고대행",
  description:
    "Bridging Korea and Georgia through AI. 풀스택 개발과 광고대행 전문 — Think Different, Work Simple, Live Easier.",
  metadataBase: new URL("https://aibridgegeorgia.tech"),
  openGraph: {
    title: "AI Bridge Georgia",
    description: "Bridging Korea and Georgia through AI",
    url: "https://aibridgegeorgia.tech",
    siteName: "AI Bridge Georgia",
    locale: "ko_KR",
    type: "website",
  },
};

// GA4 Measurement ID
const GA4_ID = "G-VZXNECL2EM";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Google tag (gtag.js) — GA4 */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}');
            `,
          }}
        />
      </head>
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
