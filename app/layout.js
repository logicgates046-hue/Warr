import './globals.css';

export const metadata = {
  title: 'KE-WAR — Which Are You In?',
  description: "Kenya's political sentiment platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
