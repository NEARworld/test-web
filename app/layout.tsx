import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

const pretendard = localFont({
  src: [
    { path: "../public/fonts/Pretendard-Thin.otf", weight: "100" },
    { path: "../public/fonts/Pretendard-ExtraLight.otf", weight: "200" },
    { path: "../public/fonts/Pretendard-Light.otf", weight: "300" },
    { path: "../public/fonts/Pretendard-Regular.otf", weight: "400" },
    { path: "../public/fonts/Pretendard-Medium.otf", weight: "500" },
    { path: "../public/fonts/Pretendard-SemiBold.otf", weight: "600" },
    { path: "../public/fonts/Pretendard-Bold.otf", weight: "700" },
    { path: "../public/fonts/Pretendard-ExtraBold.otf", weight: "800" },
    { path: "../public/fonts/Pretendard-Black.otf", weight: "900" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata = {
  title: "사회적협동조합 청소년자립학교",
  description: "청소년 자립을 지원하는 협동조합 웹서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
