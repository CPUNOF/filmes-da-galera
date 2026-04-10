/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    <div className="absolute top-6 left-0 w-full px-4 md:px-0 flex justify-end md:justify-center z-50 pointer-events-none">
      <nav className={`bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 shadow-2xl transition-all duration-500 pointer-events-auto overflow-hidden flex flex-col ${menuAberto ? 'w-72 rounded-3xl' : 'w-max rounded-full'} md:w-full md:max-w-4xl md:rounded-full`}>
        <div className="flex items-center justify-between p-1.5 md:p-2.5 gap-4">
          
          <div className="flex items-center pl-3 md:pl-5">
            {!isHome ? (
              <Link href="/" className="group flex items-center gap-3 cursor-pointer">
                {/* 🪄 BOTAO VOLTAR PREMIUM: Ícone SVG e proporções perfeitas */}
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                  <svg 
                    className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform duration-300" 
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
              <Link href="/" className="font-black text-white text-base tracking-widest flex items-center gap-2 group">
                FDG<span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse group-hover:scale-150 transition-transform"></span>
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.path} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pathname === link.path ? "text-white bg-white/10" : "text-gray-500 hover:text-white"}`}>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 md:pr-1">
            <button onClick={() => setMenuAberto(!menuAberto)} className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1 rounded-full bg-white/5">
              <span className={`w-4 h-0.5 bg-white transition-all ${menuAberto ? 'rotate-45 translate-y-1' : ''}`}></span>
              <span className={`w-4 h-0.5 bg-white transition-all ${menuAberto ? '-rotate-45 -translate-y-1' : ''}`}></span>
            </button>

            {user ? (
              <div onClick={() => signOut(auth)} className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/5 hover:bg-red-600/10 cursor-pointer transition-all group">
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10 group-hover:border-red-500 transition-colors" />
                <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">Sair</span>
              </div>
            ) : (
              <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">Logar</button>
            )}
          </div>
        </div>

        {/* MENU GAVETA MOBILE */}
        <div className={`md:hidden flex flex-col transition-all duration-300 ${menuAberto ? 'max-h-75 opacity-100 pb-2 px-2' : 'max-h-0 opacity-0 px-2'}`}>
          {navLinks.map((link) => (
            <Link key={link.name} href={link.path} onClick={() => setMenuAberto(false)} className={`p-3 my-1 rounded-xl text-[11px] font-black uppercase tracking-wider text-center transition-all ${pathname === link.path ? "text-white bg-red-600/20 border border-red-500/50" : "text-gray-400 hover:bg-white/10"}`}>
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}