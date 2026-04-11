/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc, collection, query, onSnapshot, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  
  // ESTADOS DAS MISSÕES E RECOMPENSAS
  const [pendenciasUpvote, setPendenciasUpvote] = useState(0);
  const [pendenciasNota, setPendenciasNota] = useState(0);
  
  // 🪄 NOVO: Carteira de Ingressos Dourados
  const [meusIngressos, setMeusIngressos] = useState(0); 
  
  const isHome = pathname === "/";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        try {
          const emailLower = currentUser.email.toLowerCase();
          const userRef = doc(db, "usuarios", emailLower);
          
          await setDoc(userRef, {
            nome: currentUser.displayName || "Anônimo",
            foto: currentUser.photoURL || "",
            email: currentUser.email,
            ultimoLogin: new Date().toISOString()
          }, { merge: true });

          // 🪄 FICA A OUVIR A CARTEIRA DE INGRESSOS DO UTILIZADOR EM TEMPO REAL
          onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setMeusIngressos(snap.data().ingressosDourados || 0);
            }
          });

        } catch (error) {
          console.error("Erro ao rastrear utilizador:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // O RADAR DE PENDÊNCIAS (COBRA NOTA E UPVOTE)
  useEffect(() => {
    if (!user) {
      setPendenciasUpvote(0);
      setPendenciasNota(0);
      setMeusIngressos(0);
      return;
    }

    const q = query(collection(db, "filmes"));
    
    const unsubscribe = onSnapshot(q, async (snap) => {
      let countUpvote = 0;
      const filmesAssistidosIds = [];

      snap.forEach((documento) => {
        const data = documento.data();
        
        if (data.status === "sugerido") {
          const upvotes = data.upvotes || [];
          if (!upvotes.includes(user.uid)) {
            countUpvote++;
          }
        } 
        else if (data.status === "assistido") {
          filmesAssistidosIds.push(documento.id);
        }
      });
      
      setPendenciasUpvote(countUpvote);

      let countNota = 0;
      const promessasDeNotas = filmesAssistidosIds.map(async (filmeId) => {
        try {
          const votoRef = doc(db, `filmes/${filmeId}/votos/${user.uid}`);
          const votoSnap = await getDoc(votoRef);
          if (!votoSnap.exists()) {
            return 1; 
          }
        } catch (error) {}
        return 0;
      });

      const resultados = await Promise.all(promessasDeNotas);
      countNota = resultados.reduce((a, b) => a + b, 0);
      
      setPendenciasNota(countNota);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Bem-vindo de volta!");
    } catch (error) {
      toast.error("Erro na autenticação.");
    }
  };

  const navLinks = [
    { name: "Galeria", path: "/" },
    { name: "Sugestões", path: "/sugestoes" },
    { name: "Indicar", path: "/novo" },
    { name: "Regras", path: "/recompensas" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    // 🪄 Subimos a navbar um pouquinho no mobile (top-3) para aproveitar tela
    <div className="absolute top-3 sm:top-6 left-0 w-full px-2 sm:px-4 md:px-0 flex justify-center z-50 pointer-events-none">
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <nav className="bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto flex items-center justify-between w-full md:max-w-4xl rounded-full p-1 sm:p-1.5 md:p-2.5 gap-1 sm:gap-4 mx-auto">
        
        {/* LOGO / VOLTAR */}
        <div className="flex items-center pl-1.5 sm:pl-3 md:pl-5 shrink-0">
          {!isHome ? (
            <Link href="/" className="group flex items-center gap-1.5 sm:gap-3 cursor-pointer">
              <div className="flex items-center justify-center w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Voltar</span>
            </Link>
          ) : (
            <Link href="/" className="font-black text-white text-[10px] sm:text-base tracking-widest flex items-center gap-1 sm:gap-2 group px-1 sm:px-2">
              FDG<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-600 rounded-full animate-pulse group-hover:scale-150 transition-transform"></span>
            </Link>
          )}
        </div>

        {/* MENUS (SCROLL NO MOBILE) */}
        <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto hide-scrollbar flex-1 justify-start sm:justify-center px-1">
          {navLinks.map((link) => {
            let badgeCount = 0;
            if (link.name === "Sugestões") badgeCount = pendenciasUpvote;
            if (link.name === "Galeria") badgeCount = pendenciasNota;

            return (
              <Link 
                key={link.name} 
                href={link.path} 
                // 🪄 Padding reduzido no mobile (px-2.5 py-1.5)
                className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pathname === link.path ? "text-white bg-white/10" : "text-gray-500 hover:text-white"}`}
              >
                {link.name}
                
                {badgeCount > 0 && (
                  <span className="bg-red-600 text-white text-[7px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse border border-red-400 leading-none">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* ÁREA DO USUÁRIO DIREITA */}
        <div className="flex items-center pr-1 shrink-0">
          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              
              {/* CARTEIRA DE INGRESSOS (COMPACTA) */}
              {meusIngressos > 0 && (
                <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" title="Ingressos Dourados">
                  <span className="text-[10px] sm:text-sm animate-pulse">🎫</span>
                  <span className="text-[9px] sm:text-xs font-black">{meusIngressos}</span>
                </div>
              )}

              {/* FOTO DO PERFIL */}
              <Link href={`/perfil/${user.uid}`} className="flex items-center gap-2 sm:gap-3 bg-white/5 p-0.5 sm:p-1 sm:pr-4 rounded-full border border-white/5 hover:bg-white/10 cursor-pointer transition-all group" title="Meu Perfil">
                {/* 🪄 Foto menor no mobile (w-6 h-6) */}
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-white/10 group-hover:border-white/40 transition-colors object-cover" />
                <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Perfil</span>
              </Link>

              {/* BOTÃO DE SAIR */}
              <button onClick={() => signOut(auth)} title="Sair da Conta" className="w-6 h-6 sm:w-8 sm:h-8 shrink-0 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center hover:bg-red-600 transition-all text-red-500 hover:text-white group">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all">Logar</button>
          )}
        </div>

      </nav>
    </div>
  );
}