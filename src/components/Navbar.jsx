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

  // 🪄 DETEÇÃO INTELIGENTE DE PÁGINAS ATUALIZADA
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
    else if (pathname.startsWith("/musicas")) setMenuAtivo("Músicas");
    else if (pathname.startsWith("/otaku")) setMenuAtivo("Otaku");
    else if (pathname.startsWith("/livros")) setMenuAtivo("Livros");
    else setMenuAtivo(""); // Limpa o destaque se for para o perfil, por exemplo
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
          if (adminSnap.exists() && adminSnap.data().ativo) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }

        } catch (error) { 
          console.error("Erro auth:", error); 
          setIsAdmin(false);
        }
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

  // 🪄 AS NOVAS ROTAS ESTÃO ATIVAS AQUI! (Apenas Séries continua "Em Breve" se quisermos fazer depois com TMDB)
  const categorias = [
    { name: "Feed", icon: "🌐", path: "/", status: "Ativo" },
    { name: "Filmes", icon: "🎬", path: "/filmes", status: "Ativo" },
    { name: "Séries", icon: "📺", path: "/series", status: "Ativo" },
    { name: "Músicas", icon: "🎵", path: "/musicas", status: "Ativo" },
    { name: "Otaku", icon: "🎌", path: "/otaku", status: "Ativo" },
    { name: "Livros", icon: "📚", path: "/livros", status: "Ativo" },
  ];

  const subMenuFilmes = [
    { name: "Acervo", path: "/filmes", badge: pendenciasNota },
    { name: "Fila", path: "/sugestoes", badge: pendenciasUpvote },
    { name: "Indicar", path: "/novo", badge: 0 },
    { name: "Regras", path: "/recompensas", badge: 0 },
    { name: "Lixeira", path: "/lixeira", badge: 0 },
    { name: "Olimpo", path: "/olimpo", badge: 0 },
  ];

  if (isAdmin) {
    subMenuFilmes.push({ name: "Admin", path: "/admin", badge: 0, icon: "🛡️" });
  }

  return (
    <div className="fixed top-2 sm:top-6 left-0 w-full px-2 sm:px-4 md:px-0 flex flex-col items-center z-[999] pointer-events-none">
      
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center justify-between w-full md:max-w-5xl rounded-full p-1.5 sm:p-2.5 gap-2 relative z-50">
        
        <div className="flex items-center pl-3 shrink-0">
          <Link href="/" className="font-black text-white text-sm sm:text-base tracking-widest flex items-center gap-1 group">
            FDG<span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
          </Link>
        </div>

        {/* 🪄 BARRA DE CATEGORIAS RESPONSIVA (SNAP-SCROLL) */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar flex-1 justify-start md:justify-center px-1 snap-x snap-mandatory">
          {categorias.map((cat) => (
            <Link 
              key={cat.name}
              href={cat.status === "Ativo" ? cat.path : "#"}
              onClick={(e) => {
                if (cat.status !== "Ativo") {
                  e.preventDefault();
                  toast(`A construir a área de ${cat.name}...`);
                } else {
                  setMenuAtivo(cat.name);
                  setShowSubMenu(true);
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[11px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${
                menuAtivo === cat.name 
                  ? "text-white bg-white/10 shadow-inner border border-white/5" 
                  : "text-gray-500 hover:text-gray-300"
              } ${cat.status !== "Ativo" && "opacity-50"}`}
              title={cat.name}
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>

              {cat.name === "Filmes" && totalPendenciasFilmes > 0 && (
                <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border border-red-400 ml-1">
                  {totalPendenciasFilmes}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center pr-1 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {meusIngressos > 0 && (
                <div className="hidden sm:flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full text-yellow-500">
                  <span className="text-lg">🎟️</span>
                  <span className="text-xs font-black">{meusIngressos}</span>
                </div>
              )}
              <Link href={`/perfil/${user.uid}`} className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/5 hover:bg-white/10 transition-all">
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" />
              </Link>
              <button onClick={() => signOut(auth)} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full bg-red-900/20 border border-red-900/30 flex items-center justify-center hover:bg-red-600 transition-all text-red-500 hover:text-white">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest">Entrar</button>
          )}
        </div>
      </nav>

      {/* 🪄 SUB-BARRA TAMBÉM RESPONSIVA COM SNAP */}
      <div className={`transition-all duration-500 pointer-events-auto ease-in-out ${mostrarSubMenu && menuAtivo === "Filmes" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none absolute"}`}>
        <div className="mt-2 bg-[#111111]/90 backdrop-blur-xl border border-white/5 shadow-2xl rounded-full px-2 py-1.5 flex items-center gap-1 sm:gap-2 overflow-x-auto hide-scrollbar max-w-[90vw] snap-x snap-mandatory">
          {subMenuFilmes.map(sub => (
            <Link 
              key={sub.name} 
              href={sub.path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 snap-center ${
                pathname === sub.path 
                  ? (sub.name === "Admin" ? "text-red-500 bg-red-900/20 border border-red-900/30" : "text-white bg-white/10") 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {sub.icon && <span>{sub.icon}</span>}
              {sub.name}
              {sub.badge > 0 && (
                <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-red-400 ml-1">
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