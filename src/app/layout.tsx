import { Inter } from 'next/font/google';
import "./globals.css";

// Configure Inter with subsets
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "HireFlow AI",
  description: "AI Pre-Interview Platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      {/* Force the font class directly on the body */}
      <body className={`${inter.className} antialiased selection:bg-primary-container selection:text-on-primary-container text-slate-900 bg-[#f8fafc]`}>
        {children}
      </body>
    </html>
  );
}