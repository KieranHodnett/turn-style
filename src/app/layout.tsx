import "~/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import { TRPCReactProvider } from "~/trpc/react";
import AuthProvider from "./_components/AuthProvider";
import Navbar from "./_components/NavBar"; // Optional

export const metadata: Metadata = {
  title: "Turn Style",
  description: "Track MTA stations and police presence",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <AuthProvider>
          <TRPCReactProvider>
            <Navbar />
            <main>{children}</main>
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}