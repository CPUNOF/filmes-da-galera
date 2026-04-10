/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useAdmin } from "../../lib/useAdmin";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PainelAdmin() {
  const { isAdmin, carregandoAdmin } = useAdmin();
  const [emailNovoAdmin, setEmailNovoAdmin] = useState("");
  const [listaAdmins, setListaAdmins] = useState([]);
  const [filmesAdmin, setFilmesAdmin] = useState([]); // 🪄 Agora carrega TODOS os filmes
  const [comentariosRecentes, setComentariosRecentes] = useState([]);
  const [stats, setStats] = useState({ vistos: 0, fila: 0 });
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // 🪄 ESTADOS DO MODAL DE EDIÇÃO DE AUTOR
  const [modalAutor, setModalAutor] = useState(null);
  const [novoAutorNome, setNovoAutorNome] = useState("");
  const [novoAutorFoto, setNovoAutorFoto] = useState("");

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const snapAdmins = await getDocs(collection(db, "admins"));
      const admins = [];
      snapAdmins.forEach((doc) => { if (doc.data().ativo) admins.push(doc.id); });
      setListaAdmins(admins);

      const snapFilmes = await getDocs(collection(db, "filmes"));
      let contVistos = 0;
      let contFila = 0;
      const todosFilmes = [];
      snapFilmes.forEach((doc) => {
        const data = doc.data();
        if (data.status === "assistido") contVistos++;
        else contFila++;
        todosFilmes.push({ id: doc.id, ...data });
      });
      setStats({ vistos: contVistos, fila: contFila });
      setFilmesAdmin(todosFilmes.reverse()); // Mostra os mais recentes primeiro

      const snapComents = await getDocs(collection(db, "comentarios"));
      const coments = [];
      snapComents.forEach(doc => { coments.push({ id: doc.id, ...doc.data() }); });
      const ordenados = coments.sort((a, b) => (b.dataCriacao || 0) - (a.dataCriacao || 0));
      setComentariosRecentes(ordenados.slice(0, 30));

    } catch (error) {
      console.error(error);
      toast.error("Falha ao sincronizar com o Firebase.");
    } finally { setCarregando(false); }
  };

  useEffect(() => { if (isAdmin) buscarDados(); }, [isAdmin]);

  // 🪄 FUNÇÃO PARA SALVAR O NOVO AUTOR
  const salvarNovoAutor = async (e) => {
    e.preventDefault();
    if (!modalAutor) return;
    try {
      await updateDoc(doc(db, "filmes", modalAutor.id), {
        sugeridoPor: {
          nome: novoAutorNome,
          foto: novoAutorFoto
        }
      });
      toast.success("Autor do filme atualizado!");
      setModalAutor(null);
      buscarDados();
    } catch (error) {
      toast.error("Erro ao atualizar o autor.");
    }
  };

  // Preenche o modal ao clicar em Editar
  const abrirModalEdicao = (filme) => {
    setModalAutor(filme);
    const autorAtual = filme.usuarioNome || filme.sugeridoPor || filme.autor;
    if (typeof autorAtual === 'object' && autorAtual !== null) {
      setNovoAutorNome(autorAtual.nome || autorAtual.displayName || "");
      setNovoAutorFoto(autorAtual.foto || autorAtual.photoURL || "");
    } else {
      setNovoAutorNome(typeof autorAtual === 'string' ? autorAtual : "");
      setNovoAutorFoto("");
    }
  };

  const apagarResenha = async (id) => {
    if(confirm("Apagar resenha do mapa permanentemente?")) {
      try {
        await deleteDoc(doc(db, "comentarios", id));
        toast.success("Resenha incinerada!");
        buscarDados();
      } catch(e) { toast.error("Erro na operação."); }
    }
  };

  const adicionarAdmin = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "admins", emailNovoAdmin.toLowerCase().trim()), { ativo: true });
      setEmailNovoAdmin("");
      buscarDados();
      toast.success("Novo General promovido!");
    } catch (error) { toast.error("Falha na promoção."); }
  };

  const removerAdmin = async (email) => {
    if (confirm(`Retirar poderes de ${email}?`)) {
      try {
        await deleteDoc(doc(db, "admins", email));
        buscarDados();
        toast.success("Poderes revogados.");
      } catch (error) { toast.error("Erro no rebaixamento."); }
    }
  };

  const deletarFilme = async (id, titulo) => {
    if (confirm(`Apagar permanentemente "${titulo}"?`)) {
      try {
        await deleteDoc(doc(db, "filmes", id));
        buscarDados();
        toast.success("Registro removido.");
      } catch (error) { toast.error("Erro ao apagar."); }
    }
  };

  if (carregandoAdmin) return <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center uppercase font-black">Acessando Cofre...</main>;

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="bg-[#141414] p-12 rounded-3xl border border-red-900/30 text-center">
          <h1 className="text-3xl font-black mb-4 tracking-tighter uppercase">Acesso Negado</h1>
          <button onClick={() => router.push('/')} className="bg-red-600 px-8 py-3 rounded-full font-bold">VOLTAR</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 font-sans">
      <Navbar />
      
      {/* 🪄 MODAL DE EDIÇÃO DE AUTOR */}
      {modalAutor && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] p-8 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-black uppercase mb-2 italic">Editar Autor</h3>
            <p className="text-gray-400 text-xs mb-6 uppercase tracking-widest">Filme: <strong className="text-white">{modalAutor.titulo}</strong></p>
            
            <form onSubmit={salvarNovoAutor} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Nome de quem indicou</label>
                <input 
                  type="text" value={novoAutorNome} onChange={(e) => setNovoAutorNome(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all text-white"
                  placeholder="Ex: João Silva" required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">URL da Foto do Perfil (Opcional)</label>
                <input 
                  type="text" value={novoAutorFoto} onChange={(e) => setNovoAutorFoto(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAutor(null)} className="flex-1 bg-white/5 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-36 px-6 relative z-10">
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-8 gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 uppercase italic">
              <span className="w-3 h-10 bg-red-600 rounded-full"></span> Central de Comando
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">FDG Moderação Global</p>
          </div>
          <button onClick={buscarDados} className="bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-md">
            🔄 Atualizar Banco
          </button>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
           <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl text-center">
              <span className="block text-4xl font-black text-red-600 mb-1">{stats.vistos}</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Filmes Vistos</span>
           </div>
           <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl text-center">
              <span className="block text-4xl font-black text-blue-500 mb-1">{stats.fila}</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Na Fila</span>
           </div>
           <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl text-center">
              <span className="block text-4xl font-black text-white mb-1">{listaAdmins.length}</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Admins</span>
           </div>
           <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl text-center">
              <span className="block text-4xl font-black text-green-500 mb-1">ON</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Status DB</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-10">
            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-white tracking-[0.2em] mb-6 flex items-center gap-2 uppercase">
                <span className="w-6 h-[2px] bg-red-600"></span> Promover
              </h3>
              <form onSubmit={adicionarAdmin} className="space-y-4">
                <input 
                  type="email" required value={emailNovoAdmin}
                  onChange={(e) => setEmailNovoAdmin(e.target.value)}
                  placeholder="email@google.com"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-red-600 transition-all shadow-inner"
                />
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 transition-all font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/20">Conceder Poderes</button>
              </form>
            </section>

            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-gray-400 tracking-[0.2em] mb-6 flex items-center gap-2 uppercase">
                <span className="w-6 h-[2px] bg-gray-600"></span> Admins Atuais
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {listaAdmins.map(email => (
                  <div key={email} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-red-600/30 transition-all">
                    <span className="text-[10px] text-gray-300 font-bold truncate max-w-[150px]">{email}</span>
                    <button onClick={() => removerAdmin(email)} className="text-[9px] font-black text-red-500 uppercase hover:text-red-400 bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/50">Revogar</button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-10">
            {/* 🪄 MODERAÇÃO COMPLETA DE FILMES E AUTORES */}
            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-orange-500 tracking-[0.2em] mb-8 flex items-center gap-2 uppercase">
                <span className="w-6 h-[2px] bg-orange-600"></span> Gestão de Acervo (Filmes & Sugestões)
              </h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filmesAdmin.length > 0 ? filmesAdmin.map(filme => {
                  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
                  const nomeAutor = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") : (autorRaw || "Anônimo");

                  return (
                    <div key={filme.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                      <div className="flex items-center gap-4">
                        <img src={filme.capa} className="w-12 h-16 object-cover rounded-xl shadow-lg border border-white/10" alt="" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-white uppercase italic tracking-tighter">{filme.titulo}</h4>
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${filme.status === 'assistido' ? 'bg-green-900/30 text-green-500 border-green-800' : 'bg-orange-900/30 text-orange-500 border-orange-800'}`}>
                              {filme.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1">
                            <span className="opacity-50">👤</span> {nomeAutor}
                          </p>
                        </div>
                      </div>
                      
                      {/* BOTÕES DE AÇÃO DO ADMIN */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => abrirModalEdicao(filme)} className="flex-1 sm:flex-none p-3 bg-blue-900/20 text-blue-500 border border-blue-900/30 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs shadow-inner" title="Editar Autor">
                          ✏️
                        </button>
                        <button onClick={() => deletarFilme(filme.id, filme.titulo)} className="flex-1 sm:flex-none p-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs shadow-inner" title="Apagar Filme">
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                }) : <div className="text-center py-10 text-gray-600 italic text-xs">Acervo limpo.</div>}
              </div>
            </section>

            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-blue-500 tracking-[0.2em] mb-8 flex items-center gap-2 uppercase">
                 <span className="w-6 h-[2px] bg-blue-600"></span> Monitoramento de Resenhas
              </h3>
              <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {comentariosRecentes.length > 0 ? comentariosRecentes.map(c => (
                  <div key={c.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-start justify-between hover:border-red-600/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <img src={c.usuarioFoto || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} className="w-7 h-7 rounded-full border border-white/10 object-cover" alt="Avatar" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{c.usuarioNome || "Anônimo"}</span>
                      </div>
                      <p className="text-sm text-gray-400 italic leading-relaxed pr-4">"{c.texto}"</p>
                    </div>
                    <button onClick={() => apagarResenha(c.id)} className="p-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs shadow-inner mt-1">
                      🗑️
                    </button>
                  </div>
                )) : <div className="text-center py-16 text-gray-700 italic border border-dashed border-white/5 rounded-3xl text-[10px] font-black uppercase tracking-widest">Sem evidências no mural...</div>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}