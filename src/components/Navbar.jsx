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
  const [meusIngressos, setMeusIngressos] = useState(0); 
  
  // 🪄 ESTADO DO NOVO MENU MOBILE
  const [menuAberto, setMenuAberto] = useState(false);
  
  const isHome = pathname === "/";

  // Fecha o menu mobile automaticamente quando muda de página
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

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

  // RADAR DE PENDÊNCIAS
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
          if (!upvotes.includes(user.uid)) countUpvote++;
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
          if (!votoSnap.exists()) return 1; 
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
    { name: "Lixeira 💩", path: "/lixeira" },
    { name: "Olimpo ✨", path: "/olimpo" },
    { name: "Regras", path: "/recompensas" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    <div className="absolute top-2 sm:top-6 left-0 w-full px-3 md:px-6 flex justify-center z-[999] pointer-events-none">
      
      <nav className={`pointer-events-auto bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 shadow-2xl flex flex-col w-full max-w-[1200px] transition-all duration-300 ${menuAberto ? 'rounded-[2rem]' : 'rounded-full'}`}>
        
        {/* LINHA PRINCIPAL (Sempre visível) */}
        <div className="flex items-center justify-between p-2 md:p-3 w-full">
          
          {/* LOGO / VOLTAR */}
          <div className="flex items-center pl-2 md:pl-4 shrink-0">
            {!isHome ? (
              <Link href="/" className="group flex items-center gap-2 cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                  <svg className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </div>
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Voltar</span>
              </Link>
            ) : (
              <Link href="/" className="font-black text-white text-sm sm:text-lg tracking-widest flex items-center gap-1 sm:gap-2 group px-2">
                FDG<span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse group-hover:scale-150 transition-transform"></span>
              </Link>
            )}
          </div>

          {/* 🖥️ MENU DESKTOP (Invisível no Mobile) */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-4">
            {navLinks.map((link) => {
              let badgeCount = 0;
              if (link.name === "Sugestões") badgeCount = pendenciasUpvote;
              if (link.name === "Galeria") badgeCount = pendenciasNota;

              return (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest transition-all shrink-0 ${pathname === link.path ? "text-white bg-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                >
                  {link.name}
                  {badgeCount > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)] animate-pulse border border-red-400 leading-none">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ÁREA DO USUÁRIO (Direita) */}
          <div className="flex items-center gap-2 md:gap-3 pr-1 shrink-0">
            {user ? (
              <>
                {/* CARTEIRA DE INGRESSOS */}
                {meusIngressos > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" title="Ingressos Dourados">
                    <span className="text-sm sm:text-lg animate-pulse">🎫</span>
                    <span className="text-[10px] sm:text-xs font-black">{meusIngressos}</span>
                  </div>
                )}

                {/* FOTO DO PERFIL E TEXTO */}
                <Link href={`/perfil/${user.uid}`} className="flex items-center gap-2 sm:gap-3 bg-white/5 p-1 pr-3 md:pr-4 rounded-full border border-white/5 hover:bg-white/10 transition-all group" title="Meu Perfil">
                  <img src={user.photoURL} alt="Avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/10 group-hover:border-white/40 transition-colors object-cover" />
                  {/* 🪄 Agora o texto PERFIL aparece no mobile também! */}
                  <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Perfil</span>
                </Link>

                {/* BOTÃO DE SAIR (Apenas no PC) */}
                <button onClick={() => signOut(auth)} title="Sair da Conta" className="hidden md:flex w-10 h-10 shrink-0 rounded-full bg-red-900/20 border border-red-900/30 items-center justify-center hover:bg-red-600 transition-all text-red-500 hover:text-white group">
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </>
            ) : (
              <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Logar</button>
            )}

            {/* 📱 BOTÃO HAMBÚRGUER (Apenas no Mobile) */}
            <button 
              onClick={() => setMenuAberto(!menuAberto)} 
              className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-[4px] bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors shrink-0"
            >
              <span className={`w-4 h-[2px] bg-white rounded-full transition-all duration-300 ${menuAberto ? 'rotate-45 translate-y-[6px]' : ''}`}></span>
              <span className={`w-4 h-[2px] bg-white rounded-full transition-all duration-300 ${menuAberto ? 'opacity-0' : ''}`}></span>
              <span className={`w-4 h-[2px] bg-white rounded-full transition-all duration-300 ${menuAberto ? '-rotate-45 -translate-y-[6px]' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* 📱 MENU DROPDOWN MOBILE */}
        <div className={`lg:hidden flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${menuAberto ? 'max-h-[500px] opacity-100 border-t border-white/5 pt-2 pb-4' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col gap-2 px-4 mt-2">
            {navLinks.map((link) => {
              let badgeCount = 0;
              if (link.name === "Sugestões") badgeCount = pendenciasUpvote;
              if (link.name === "Galeria") badgeCount = pendenciasNota;

              return (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  className={`flex items-center justify-between px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all ${pathname === link.path ? "bg-white/10 text-white border border-white/5" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                >
                  {link.name}
                  {badgeCount > 0 && (
                    <span className="bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-full text-[9px] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      {badgeCount} Pendentes
                    </span>
                  )}
                </Link>
              );
            })}
            
            {/* Botão de Deslogar no Menu Mobile */}
            {user && (
              <button onClick={() => signOut(auth)} className="flex items-center justify-between px-4 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-500 hover:bg-red-900/20 transition-all mt-2 border border-transparent hover:border-red-900/30">
                Sair da Conta
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>

      </nav>
    </div>
  );
}