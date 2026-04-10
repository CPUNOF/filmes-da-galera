import Link from "next/link";
import Navbar from "@/components/Navbar";
import ListaSugestoes from "@/components/ListaSugestoes";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const revalidate = 0; // Garante dados sempre novos

export default async function Sugestoes() {
  // Busca APENAS os filmes que têm o status "sugerido"
  const q = query(collection(db, "filmes"), where("status", "==", "sugerido"));
  const querySnapshot = await getDocs(q);
  
  const sugestoes = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px] bg-red-900/20 blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-[1400px] mx-auto px-6 pt-6 sm:pt-10 relative z-10">
        <Navbar />

        <div className="max-w-3xl mx-auto mt-16 sm:mt-24 text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            FILA DE SUGESTÕES
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-medium">
            O acervo completo com todas as indicações da galera. Vote nos seus favoritos!
          </p>
          
          <Link 
            href="/novo" 
            className="inline-flex items-center gap-2 mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 hover:scale-105"
          >
            🎬 Indicar um Filme
          </Link>
        </div>

        {/* Passamos os dados para o componente de cliente que vamos criar agora */}
        <ListaSugestoes filmesIniciais={sugestoes} />
        
      </div>
    </main>
  );
}