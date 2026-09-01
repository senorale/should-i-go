import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'
import SideNav from "./components/nav/SideNav";
import Footer from "./components/nav/Footer";
import ChatToggle from "./components/chat/ChatToggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Should I Go To School?",
  description: "Calculate the true cost of attenting college",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1">
            <SideNav />
            <div className="min-w-0 flex-1">{children}</div>
            <ChatToggle />
          </div>
          <Footer />
        </div>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
