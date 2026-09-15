import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LevelUp Architect",
    template: "%s | LevelUp Architect",
  },
  description:
    "Adaptive RPG-style learning for Cloud Solution Architects.",
};

const themeScript = `
  (() => {
    const param = new URLSearchParams(window.location.search).get("scoutTheme");
    const theme =
      param || window.localStorage.getItem("levelup-theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
