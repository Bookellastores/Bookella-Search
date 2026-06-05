import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Bookella | منصة إدارة غلال مخزون الكتب الموحد",
  description: "المنصة المتكاملة والتسعير الذكي لمتاجر بيع الكتب ومزودي الخدمات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-stone-50 text-stone-900 antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
