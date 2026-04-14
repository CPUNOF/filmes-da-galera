import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; // 👈 Importamos o Toaster aqui
import PlayerGlobal from "@/components/PlayerGlobal";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Filmes da Galera",
  description: "Nossa curadoria particular de cinema.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        
        {/* 🍞 O TOASTER FICA AQUI NO FINAL DO BODY */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#141414',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 'bold',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#141414' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#141414' },
            },
          }}
        />

        <PlayerGlobal />
      </body>
    </html>
  );
}