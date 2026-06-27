import "./globals.css";

export const metadata = {
  title: "한국의 맛 — Korean Kitchen | Tbilisi, Georgia",
  description:
    "정통 한국 요리를 트빌리시에서 만나보세요. 신선한 재료, 정성껏 만든 음식, 합리적인 가격.",
  metadataBase: new URL("https://aibridgegeorgia.tech"),
  openGraph: {
    title: "한국의 맛 — Korean Kitchen",
    description: "정통 한국 요리를 트빌리시에서 만나보세요.",
    url: "https://aibridgegeorgia.tech",
    siteName: "한국의 맛",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
