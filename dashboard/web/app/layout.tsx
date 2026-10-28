import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const ui = Plus_Jakarta_Sans({ variable: "--font-ui", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "PATY San Jorge · Gemelo digital",
  other: { google: "notranslate" },
  description: "Planta de elaborados en tiempo real: modelo 3D, indicadores y estadísticas de la simulación FlexSim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // extensiones como Night Eye le agregan atributos a <html> antes de que cargue React: sin esto, error de hidratación
    <html lang="es" translate="no" className={`${ui.variable} notranslate`} suppressHydrationWarning>
      <body className="min-h-screen"><Shell>{children}</Shell></body>
    </html>
  );
}
