import type { Metadata } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://immerseafy.com";

const siteDescription =
  "Freediving training, courses, and community. Discover calm beneath the surface with Immerseafy.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Immerseafy Freediving",
    template: "%s | Immerseafy Freediving",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Immerseafy Freediving",
    title: "Immerseafy Freediving",
    description: siteDescription,
    images: [
      {
        url: "/og-image.png",
        width: 512,
        height: 512,
        alt: "Immerseafy Freediving",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Immerseafy Freediving",
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
