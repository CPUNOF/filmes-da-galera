/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const isHome = pathname === "/";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // USER TRACKER: Salva quem logou no banco de dados automaticamente!
      if (currentUser && currentUser.email) {
        try {
          await setDoc(doc(db, "usuarios", currentUser.email.toLowerCase()), {
            nome: currentUser.displayName || "Anônimo",
            foto: currentUser.photoURL || "",
            email: currentUser.email,
            ultimoLogin: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Erro ao rastrear usuário:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
    { name: "Admin", path: "/admin" },
  ];

  return (
    <div className="absolute top-4 sm:top-6 left-0 w-full px-2 sm:px-4 md:px-0 flex justify-center z-50 pointer-events-none">
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <nav className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto flex items-center justify-between w-full md:max-w-4xl rounded-full p-1 sm:p-1.5 md:p-2.5 gap-1 sm:gap-4 mx-auto">
        
        <div className="flex items-center pl-1 sm:pl-3 md:pl-5 shrink-0">
          {!isHome ? (
            <Link href="/" className="group flex items-center gap-1.5 sm:gap-3 cursor-pointer">
              <div className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <svg 
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:-translate-x-0.5 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Voltar</span>
            </Link>
          ) : (
            <Link href="/" className="font-black text-white text-xs sm:text-base tracking-widest flex items-center gap-1.5 sm:gap-2 group px-2">
              FDG<span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-600 rounded-full animate-pulse group-hover:scale-150 transition-transform"></span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto hide-scrollbar flex-1 justify-center">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.path} 
              className={`px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pathname === link.path ? "text-white bg-white/10" : "text-gray-500 hover:text-white"}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center pr-1 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* 🪄 AGORA O BOTÃO COM A FOTO LEVA DIRETO PRO SEU PERFIL */}
              <Link 
                href={`/perfil/${user.uid}`} 
                className="flex items-center gap-2 sm:gap-3 bg-white/5 p-1 sm:pr-4 rounded-full border border-white/5 hover:bg-white/10 cursor-pointer transition-all group"
                title="Meu Perfil"
              >
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 group-hover:border-white/40 transition-colors object-cover" />
                <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Perfil</span>
              </Link>

              {/* 🪄 NOVO BOTÃO DE SAIR (Logout) - Ícone discreto e funcional */}
              <button 
                onClick={() => signOut(auth)} 
                title="Sair da Conta"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center hover:bg-red-600 transition-all text-red-500 hover:text-white group"
              >
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