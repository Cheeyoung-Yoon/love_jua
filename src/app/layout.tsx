import './globals.css' // ← must be here, top-level
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-100">{children}</body>
    </html>
  )
}
