import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Raleway } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mad Muscles Gym | Management System",
  description: "Manage your gym from one powerful dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${raleway.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider afterSignOutUrl="/">
          {children}
          <Toaster richColors position="top-right" />
        </ClerkProvider>
      </body>
    </html>
  );
}
