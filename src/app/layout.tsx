import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "mapbox-gl/dist/mapbox-gl.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "112 Live",
  description: "Een Een Twee Live",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ width: "100%", height: "100%", margin: 0, boxSizing: "border-box" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
