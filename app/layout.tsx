import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marcopolo Admin",
  description: "マルコポーロ合同会社 管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
