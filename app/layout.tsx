import type { Metadata } from "next";
import "./globals.css";
import NextStepWrapper from "./NextStepWrapper";

export const metadata: Metadata = {
  title: "Foto's voor onze bruiloft",
  description: "Help ons de dag vast te leggen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        <NextStepWrapper>{children}</NextStepWrapper>
      </body>
    </html>
  );
}
