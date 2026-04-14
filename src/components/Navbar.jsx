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
  
  const [pendenciasUpvote, setPendenciasUpvote] = useState(0);
  const [pendenciasNota, setPendenciasNota] = useState(0);
  const [meusIngressos, setMeusIngressos] = useState(0); 
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuAtivo, setMenuAtivo] = useState("Feed"); 
  const [mostrarSubMenu, setShowSubMenu] = useState(true);

  useEffect(() => {
    if (pathname === "/") setMenuAtivo("Feed");
    else if (
      pathname.startsWith("/filmes") || 
      pathname === "/sugestoes" || 
      pathname === "/novo" || 
      pathname === "/lixeira" || 
      pathname === "/olimpo" || 
      pathname === "/recompensas" ||
      pathname === "/admin"
    ) {
      setMenuAtivo("Filmes");
    }
    else setMenuAtivo(""); 
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setShowSubMenu(false);
      else setShowSubMenu(true);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            if (snap.exists()) setMeusIngressos(snap.data().ingressosDourados || 0);
          });

          const adminRef = doc(db, "admins", emailLower);
          const adminSnap = await getDoc(adminRef);
          setIsAdmin(adminSnap.exists() && adminSnap.data().ativo);
        } catch (error) { setIsAdmin(false); }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setPendenciasUpvote(0); setPendenciasNota(0); setMeusIngressos(0);
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
        } else if (data.status === "assistido") {
          filmesAssistidosIds.push(documento.id);
        }
      });
      setPendenciasUpvote(countUpvote);

      const promessasDeNotas = filmesAssistidosIds.map(async (filmeId) => {
        try {
          const votoSnap = await getDoc(doc(db, `filmes/${filmeId}/votos/${user.uid}`));
          if (!votoSnap.exists()) return 1; 
        } catch (error) {}
        return 0;
      });
      const resultados = await Promise.all(promessasDeNotas);
      setPendenciasNota(resultados.reduce((a, b) => a + b, 0));
    });
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Autenticado com sucesso.");
    } catch (error) { toast.error("Falha na autenticação."); }
  };

  const totalPendenciasFilmes = pendenciasUpvote + pendenciasNota;

  const categorias = [
    { 
      name: "Feed", 
      path: "/", 
      icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg> 
    },
    { 
      name: "Cine Clube", 
      path: "/filmes", 
      icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25m0-5.25v5.25M7.125 18.375h9.75c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125H7.125c-.621 0-1.125.504-1.125 1.125v5.25c0 .621.504 1.125 1.125 1.125z"/></svg> 
    },
    { 
      name: "Regras", 
      path: "/recompensas", 
      icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/></svg> 
    },
  ];

  const subMenuFilmes = [
    { name: "Acervo", path: "/filmes", badge: pendenciasNota, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg> },
    { name: "Fila", path: "/sugestoes", badge: pendenciasUpvote, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg> },
    { name: "Indicar", path: "/novo", badge: 0, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg> },
    { name: "Olimpo", path: "/olimpo", badge: 0, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> },
    { name: "Lixeira", path: "/lixeira", badge: 0, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg> },
  ];

  if (isAdmin) {
    subMenuFilmes.push({ name: "Admin", path: "/admin", badge: 0, icon: <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg> });
  }

  return (
    <div className="fixed top-2 sm:top-6 left-0 w-full px-3 sm:px-4 md:px-0 flex flex-col items-center z-[999] pointer-events-none">
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes navGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .nav-animated-bg {
          background: linear-gradient(120deg, rgba(10,10,10,0.95), rgba(20,5,15,0.95), rgba(5,15,25,0.95), rgba(10,10,10,0.95));
          background-size: 300% 300%;
          animation: navGradient 12s ease infinite;
        }
      `}</style>
      
      <nav className="nav-animated-bg backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] pointer-events-auto flex items-center justify-between w-full md:max-w-4xl rounded-full p-1.5 sm:p-2 relative z-50">
        
        {/* LADO ESQUERDO: LOGO */}
        <div className="flex items-center pl-3 sm:pl-4 shrink-0">
          <Link href="/" className="font-black text-white text-sm sm:text-base tracking-widest flex items-center gap-1 hover:scale-105 transition-transform">
            FDG<span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
          </Link>
        </div>

        {/* 🪄 CENTRO: NAVEGAÇÃO COM TEXTO VISÍVEL NO MOBILE */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center px-1">
          {categorias.map((cat) => (
            <Link 
              key={cat.name}
              href={cat.path}
              onClick={() => { setMenuAtivo(cat.name); setShowSubMenu(true); }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-6 sm:py-2.5 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                menuAtivo === cat.name || (cat.name === "Cine Clube" && menuAtivo === "Filmes")
                  ? "text-white bg-white/10 shadow-inner border border-white/10" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{cat.icon}</span>
              {/* A MÁGICA: O texto agora é 'inline' também no mobile, sem a class 'hidden' */}
              <span className="inline">{cat.name}</span>

              {cat.name === "Cine Clube" && totalPendenciasFilmes > 0 && (
                <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg ml-0.5 sm:ml-1">
                  {totalPendenciasFilmes}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* LADO DIREITO: PÍLULA DE PERFIL PREMIUM */}
        <div className="flex items-center pr-1 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 border border-white/5 p-1 pr-1.5 sm:pr-2 rounded-full shadow-inner hover:bg-black/60 hover:border-white/20 transition-all group">
              
              {meusIngressos > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-2">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-yellow-500"><path d="M22 10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-2.54c-1.19.69-2 1.99-2 3.54s.81 2.85 2 3.54V18H4v-3.46c1.19-.69 2-1.99 2-3.54s-.81-2.85-2-3.54V6h16v1.46zM11 9h2v6h-2z"/></svg>
                  <span className="text-xs font-black text-yellow-500 drop-shadow-md">{meusIngressos}</span>
                </div>
              )}
              
              <Link href={`/perfil/${user.uid}`} className="flex items-center gap-2 cursor-pointer">
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-transparent group-hover:border-white/30 transition-all shadow-md" />
                <span className="hidden sm:block text-[10px] font-black uppercase text-gray-300 tracking-widest truncate max-w-[100px] group-hover:text-white transition-colors">
                  {user.displayName?.split(" ")[0]}
                </span>
              </Link>
              
              {/* DIVISÓRIA: Agora visível no mobile também para ficar elegante! */}
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
              
              <button onClick={() => signOut(auth)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Sair">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-white text-black hover:bg-gray-200 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest transition-colors shadow-lg">Entrar</button>
          )}
        </div>
      </nav>

      {/* 🪄 SUB-BARRA TAMBÉM RESPONSIVA COM SNAP E MAIS LARGURA (95vw) */}
      <div className={`transition-all duration-500 pointer-events-auto ease-in-out ${mostrarSubMenu && (menuAtivo === "Filmes" || menuAtivo === "Cine Clube") ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none absolute"}`}>
        <div className="mt-2 bg-[#111111]/90 backdrop-blur-xl border border-white/5 shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar max-w-[95vw] sm:max-w-[90vw] snap-x snap-mandatory">
          {subMenuFilmes.map(sub => (
            <Link 
              key={sub.name} 
              href={sub.path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${
                pathname === sub.path 
                  ? (sub.name === "Admin" ? "text-red-500 bg-red-900/20 border border-red-900/30 shadow-[0_0_10px_rgba(220,38,38,0.2)]" : "text-white bg-white/10 shadow-inner border border-white/10") 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {sub.icon && <span className={`${pathname === sub.path ? '' : 'opacity-70'}`}>{sub.icon}</span>}
              {sub.name}
              {sub.badge > 0 && (
                <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-md ml-1">
                  {sub.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}