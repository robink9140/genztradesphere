import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'GenZTradeSphere | B2B Fashion Wholesale', description: 'Discover on-trend clothing at business-friendly wholesale prices. Built for retailers, boutiques and growing businesses across India.', openGraph: { title: 'GenZTradeSphere | Wholesale style. Retail potential.', description: 'A modern wholesale fashion destination for businesses.' } };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
