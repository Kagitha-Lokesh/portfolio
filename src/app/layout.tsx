import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScrollProvider } from "@/lib/scroll";
import { PROFILE } from "@/lib/data";

const interTight = localFont({
  src: "../fonts/InterTight-Variable.woff2",
  variable: "--font-inter-tight",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    {
      path: "../fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f4f2ee",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: `${PROFILE.name} — ${PROFILE.role}`,
  description: `${PROFILE.name} — ${PROFILE.role}. ${PROFILE.resumeSummary}`,
  metadataBase: new URL("https://lokesh-kagitha-portfolio.vercel.app"),
  openGraph: {
    title: `${PROFILE.name} — ${PROFILE.role}`,
    description: PROFILE.resumeSummary,
    url: "https://lokesh-kagitha-portfolio.vercel.app",
    siteName: `${PROFILE.name} Portfolio`,
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: `${PROFILE.name} — ${PROFILE.role}`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PROFILE.name} — ${PROFILE.role}`,
    description: PROFILE.resumeSummary,
    images: ["/og.jpg"],
  },
  icons: {
    icon: "/portrait-bust.webp",
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
      className={`${interTight.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var o=new MutationObserver(function(m){for(var i=0;i<m.length;i++){var t=m[i].target;if(t&&t.removeAttribute&&t.hasAttribute('bis_skin_checked')){t.removeAttribute('bis_skin_checked');}}});o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked']});window.addEventListener('DOMContentLoaded',function(){setTimeout(function(){o.disconnect()},3000)})}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="antialiased selection:bg-[#0d0d0d] selection:text-[#f4f2ee]"
        suppressHydrationWarning
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
