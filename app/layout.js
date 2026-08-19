import "./globals.css";

export const metadata = {
  title: "WAR — Which Are You In?",
  description:
    "WAR is a political preference platform where people make their voices heard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
