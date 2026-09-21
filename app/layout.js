import "./globals.css";
import Script from "next/script";
import Footer from "./components/Footer";

const ADS = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Chorus — the daily crowd-guessing game",
  description:
    "One question a day. Guess the 5 answers most people gave, race the clock, and climb your friends' leaderboard. New puzzle every day.",
  applicationName: "Chorus",
  openGraph: {
    title: "Chorus",
    description: "Guess what the crowd said. Beat your friends. New puzzle daily.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chorus",
    description: "Guess what the crowd said. Beat your friends. New puzzle daily.",
  },
};

export const viewport = {
  themeColor: "#101113",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap"
        />
      </head>
      <body>
        {ADS && (
          <Script
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS}`}
          />
        )}
        <div className="app">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
