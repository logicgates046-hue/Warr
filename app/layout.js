import { Archivo_Black, Inter } from 'next/font/google';
import './globals.css';

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
        <div className="ticker-wrap">
          <div className="ticker">
            🔴 LIVE — WANTAM votes counting · TUTAM votes counting · Join the movement · Which are you in? &nbsp;&nbsp;&nbsp;&nbsp;
            🔴 LIVE — WANTAM votes counting · TUTAM votes counting · Join the movement · Which are you in? &nbsp;&nbsp;&nbsp;&nbsp;
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
