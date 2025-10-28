import "@/styles/globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "pao do mauro — Sistema de Organização Empresarial",
  description: "Gestão completa de pedidos, produção, estoque e finanças para padarias artesanais.",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/app-icon.svg" }],
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-slate-100 font-sans antialiased")}> 
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
