"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { useAdmin } from "../lib/useAdmin"; // Importamos o nosso detetive de admins

export default function Navbar() {
  const [usuario, setUsuario] = useState(null);
  const { isAdmin } = useAdmin(); // Pergunta se o usuário logado é admin

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userLogado) => {
      setUsuario(userLogado);
    });
    return () => unsubscribe();
  }, []);

  const fazerLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.log("Erro ao fazer login:", error);
    }
  };

  const fazerLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex justify-between items-center mb-4 sm:mb-12 border-b border-gray-800 pb-4 max-w-6xl mx-auto mt-4">
      <Link href="/">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-500 tracking-wider hover:text-red-400 transition-colors cursor-pointer">
        </h1>
      </Link>
      
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Só mostra o botão de + Indicar Filme se a pessoa estiver logada */}
        {usuario && (
          <Link href="/novo" className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md font-semibold transition-colors text-xs sm:text-base">
            + Indicar Filme
          </Link>
        )}
        
        {usuario ? (
          <div className="flex items-center gap-3 bg-gray-800 py-1 pl-1 pr-3 sm:pr-4 rounded-full border border-gray-700">
            <img src={usuario.photoURL} alt="Perfil" className="w-8 h-8 rounded-full" />
            <span className="text-sm font-medium text-gray-200 hidden sm:block">
              {usuario.displayName.split(" ")[0]}
            </span>

            {/* A ENGRENAGEM SECRETA: Só aparece para os Admins! */}
            {isAdmin && (
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors ml-1" title="Central de Comando">
                ⚙️
              </Link>
            )}

            <button onClick={fazerLogout} className="text-sm text-red-400 hover:text-red-300 ml-2 font-bold">
              Sair
            </button>
          </div>
        ) : (
          <button onClick={fazerLogin} className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 py-2 rounded-md font-semibold transition-colors text-sm sm:text-base">
            Entrar com Google
          </button>
        )}
      </div>
    </header>
  );
}