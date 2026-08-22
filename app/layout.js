import { Archivo_Black, Inter } from 'next/font/google';
import './globals.css';
import LiveTicker from '@/components/LiveTicker';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'KE-WAR — Which Are You In?',
  description: "Kenya's political sentiment platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${inter.variable}`}>
      <body>
        <LiveTicker />
        {children}
      </body>
    </html>
  );
}
