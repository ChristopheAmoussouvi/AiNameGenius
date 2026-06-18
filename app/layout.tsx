import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: "AINameGenius — Smart names. Verified potential.",
  description:
    "Describe your idea and get brandable names — each with domain availability, INPI trademark pre-checks, and one-click registration.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={font.variable}>
      <body style={{ fontFamily: "var(--font-jakarta), Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
