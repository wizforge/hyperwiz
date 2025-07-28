import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://hyperwiz.dev'),
  title: "HyperWiz - Secure HTTP Client with Built-in Authentication",
  description: "A secure, lightweight HTTP client library with built-in authentication, token management, and encryption for modern web applications.",
  keywords: ["http-client", "typescript", "authentication", "token-management", "encryption", "browser", "web-crypto"],
  authors: [{ name: "Parth Tyagi" }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "HyperWiz - Secure HTTP Client with Built-in Authentication",
    description: "A secure, lightweight HTTP client library with built-in authentication, token management, and encryption for modern web applications.",
    type: "website",
    url: "https://hyperwiz.dev",
    images: [
      {
        url: '/logo.png',
        width: 48,
        height: 48,
        alt: 'HyperWiz Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "HyperWiz - Secure HTTP Client with Built-in Authentication",
    description: "A secure, lightweight HTTP client library with built-in authentication, token management, and encryption for modern web applications.",
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased bg-gray-950 text-gray-100 min-h-screen font-sans"
      >
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
