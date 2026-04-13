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
  
  const [emailNovoMembro, setEmailNovoMembro] = useState("");
  const [listaMembros, setListaMembros] = useState([]);
  
  const [emailNovoAdmin, setEmailNovoAdmin] = useState("");
  const [listaAdmins, setListaAdmins] = useState([]);
  
  const [filmesAdmin, setFilmesAdmin] = useState([]); 
  const [comentariosRecentes, setComentariosRecentes] = useState([]);
  const [listaUsuarios, setListaUsuarios] = useState([]); 
  
  // 🪄 NOVOS ESTADOS DE BUSCA
  const [filtroFilmes, setFiltroFilmes] = useState("");
  const [filtroUsuarios, setFiltroUsuarios] = useState("");

  const [stats, setStats] = useState({ vistos: 0, fila: 0 });
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

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

      const snapMembros = await getDocs(collection(db, "membros"));
      const membros = [];
      snapMembros.forEach((doc) => { membros.push(doc.id); });
      setListaMembros(membros);

      const snapUsuarios = await getDocs(collection(db, "usuarios"));
      const users = [];
      snapUsuarios.forEach((doc) => { users.push(doc.data()); });
      users.sort((a, b) => new Date(b.ultimoLogin || 0) - new Date(a.ultimoLogin || 0));
      setListaUsuarios(users);

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
      setFilmesAdmin(todosFilmes.sort((a, b) => new Date(b.dataCriacao || 0) - new Date(a.dataCriacao || 0))); 

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

  const autorizarUsuario = async (email) => {
    try {
      await setDoc(doc(db, "membros", email.toLowerCase().trim()), { ativo: true });
      buscarDados();
      toast.success("Acesso liberado!");
    } catch (error) { toast.error("Falha ao autorizar."); }
  };

  const promoverAdminUsuario = async (email) => {
    if (confirm(`Dar poderes de Admin para ${email}?`)) {
      try {
        await setDoc(doc(db, "admins", email.toLowerCase().trim()), { ativo: true });
        buscarDados();
        toast.success("Novo Admin nomeado!");
      } catch (error) { toast.error("Falha ao promover."); }
    }
  };

  const adicionarMembro = async (e) => {
    e.preventDefault();
    autorizarUsuario(emailNovoMembro);
    setEmailNovoMembro("");
  };

  const removerMembro = async (email) => {
    if (confirm(`Remover permissão de ${email}?`)) {
      try {
        await deleteDoc(doc(db, "membros", email));
        buscarDados();
        toast.success("Membro removido.");
      } catch (error) { toast.error("Erro ao remover membro."); }
    }
  };

  const adicionarAdmin = async (e) => {
    e.preventDefault();
    promoverAdminUsuario(emailNovoAdmin);
    setEmailNovoAdmin("");
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

  const salvarNovoAutor = async (e) => {
    e.preventDefault();
    if (!modalAutor) return;
    try {
      await updateDoc(doc(db, "filmes", modalAutor.id), {
        sugeridoPor: { nome: novoAutorNome, foto: novoAutorFoto }
      });
      toast.success("Autor atualizado!");
      setModalAutor(null);
      buscarDados();
    } catch (error) { toast.error("Erro ao atualizar o autor."); }
  };

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
    if(confirm("Apagar resenha do mapa?")) {
      try {
        await deleteDoc(doc(db, "comentarios", id));
        toast.success("Resenha apagada!");
        buscarDados();
      } catch(e) { toast.error("Erro na operação."); }
    }
  };

  const deletarFilme = async (id, titulo) => {
    if (confirm(`Apagar "${titulo}"?`)) {
      try {
        await deleteDoc(doc(db, "filmes", id));
        buscarDados();
        toast.success("Registro removido.");
      } catch (error) { toast.error("Erro ao apagar."); }
    }
  };

  // 🪄 NOVO: FUNÇÃO INICIAR SESSÃO AO VIVO
  const iniciarSessao = async (id, titulo) => {
    if(confirm(`Iniciar a sessão de "${titulo}" agora? Isso enviará um Alerta Ao Vivo no Feed.`)) {
      try {
        await updateDoc(doc(db, "filmes", id), {
          status: "assistido",
          dataAssistido: new Date().toISOString()
        });
        toast.success("🔴 Sessão Iniciada!");
        buscarDados();
      } catch(e) {
        toast.error("Erro ao iniciar sessão.");
      }
    }
  };

  if (carregandoAdmin) return <main className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center uppercase font-black">Acessando...</main>;

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

  // Lógica de Filtro
  const filmesFiltrados = filmesAdmin.filter(f => f.titulo.toLowerCase().includes(filtroFilmes.toLowerCase()));
  const usuariosFiltrados = listaUsuarios.filter(u => u.nome.toLowerCase().includes(filtroUsuarios.toLowerCase()) || u.email.toLowerCase().includes(filtroUsuarios.toLowerCase()));

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 font-sans">
      <Navbar />
      
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
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">URL da Foto</label>
                <input 
                  type="text" value={novoAutorFoto} onChange={(e) => setNovoAutorFoto(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm outline-none focus:border-blue-500 transition-all text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalAutor(null)} className="flex-1 bg-white/5 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-36 px-6 relative z-10">
        <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-white/5 pb-8 gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-4 uppercase italic">
              <span className="w-3 h-10 bg-red-600 rounded-full"></span> Admin
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">Painel de Controle</p>
          </div>
          <button onClick={buscarDados} className="bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-md">
            🔄 Atualizar DB
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
              <span className="block text-4xl font-black text-white mb-1">{listaMembros.length}</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Membros</span>
           </div>
           <div className="bg-[#141414] border border-white/5 p-6 rounded-3xl shadow-xl text-center">
              <span className="block text-4xl font-black text-green-500 mb-1">ON</span>
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Status DB</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-10">
            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-green-500 tracking-[0.2em] mb-6 uppercase">
                Adicionar Membro
              </h3>
              <form onSubmit={adicionarMembro} className="space-y-4">
                <input 
                  type="email" required value={emailNovoMembro} onChange={(e) => setEmailNovoMembro(e.target.value)}
                  placeholder="amigo@email.com"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-green-600 text-white"
                />
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 font-black py-4 rounded-2xl text-[10px] text-white uppercase tracking-[0.2em]">Autorizar</button>
              </form>
            </section>

            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-[11px] font-black text-white tracking-[0.2em] mb-6 uppercase">
                Promover Admin
              </h3>
              <form onSubmit={adicionarAdmin} className="space-y-4">
                <input 
                  type="email" required value={emailNovoAdmin} onChange={(e) => setEmailNovoAdmin(e.target.value)}
                  placeholder="admin@email.com"
                  className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-red-600 text-white"
                />
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-black py-4 rounded-2xl text-[10px] text-white uppercase tracking-[0.2em]">Conceder Poderes</button>
              </form>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-[11px] font-black text-orange-500 tracking-[0.2em] uppercase">
                  Acervo de Filmes
                </h3>
                {/* 🪄 BARRA DE PESQUISA */}
                <input 
                  type="text" placeholder="Buscar filme..." value={filtroFilmes} onChange={(e) => setFiltroFilmes(e.target.value)}
                  className="bg-black border border-white/10 rounded-lg px-4 py-2 text-xs outline-none focus:border-orange-500 w-full sm:w-48"
                />
              </div>
              
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {filmesFiltrados.length > 0 ? filmesFiltrados.map(filme => {
                  const autorRaw = filme.usuarioNome || filme.sugeridoPor || filme.autor;
                  const nomeAutor = typeof autorRaw === 'object' && autorRaw !== null ? (autorRaw.nome || autorRaw.displayName || "Desconhecido") : (autorRaw || "Anônimo");

                  return (
                    <div key={filme.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all gap-4">
                      <div className="flex items-center gap-4">
                        <img src={filme.capa} className="w-10 h-14 object-cover rounded-md shadow-lg border border-white/10" alt="" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-white uppercase tracking-tighter">{filme.titulo}</h4>
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${filme.status === 'assistido' ? 'bg-green-900/30 text-green-500 border-green-800' : 'bg-orange-900/30 text-orange-500 border-orange-800'}`}>
                              {filme.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1">
                            {nomeAutor}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {/* 🪄 BOTÃO AO VIVO (Só aparece se o filme estiver sugerido) */}
                        {filme.status === 'sugerido' && (
                           <button onClick={() => iniciarSessao(filme.id, filme.titulo)} className="flex-1 sm:flex-none px-3 py-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded-xl hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase" title="Iniciar Sessão Ao Vivo">
                             ▶ PLAY
                           </button>
                        )}
                        <button onClick={() => abrirModalEdicao(filme)} className="flex-1 sm:flex-none p-2 bg-blue-900/20 text-blue-500 border border-blue-900/30 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs" title="Editar">✏️</button>
                        <button onClick={() => deletarFilme(filme.id, filme.titulo)} className="flex-1 sm:flex-none p-2 bg-gray-900/50 text-gray-400 border border-gray-700 rounded-xl hover:bg-red-600 hover:text-white hover:border-transparent transition-all text-xs" title="Apagar">🗑️</button>
                      </div>
                    </div>
                  );
                }) : <div className="text-center py-10 text-gray-600 italic text-xs">Nenhum filme encontrado.</div>}
              </div>
            </section>

          </div>
        </div>

        {/* CONTROLE DE ACESSOS */}
        <section className="bg-[#111111] p-8 rounded-[2rem] border border-white/5 shadow-2xl mt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-[11px] font-black text-purple-500 tracking-[0.2em] uppercase">
              Banco de Usuários (Auth)
            </h3>
            {/* 🪄 BARRA DE PESQUISA */}
            <input 
              type="text" placeholder="Buscar usuário..." value={filtroUsuarios} onChange={(e) => setFiltroUsuarios(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-4 py-2 text-xs outline-none focus:border-purple-500 w-full sm:w-64"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {usuariosFiltrados.map(u => {
              const isMembro = listaMembros.includes(u.email);
              const isAdminUser = listaAdmins.includes(u.email);
              
              return (
                <div key={u.email} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/20 transition-all">
                   <div className="flex items-center gap-3 mb-4">
                     <img src={u.foto || "https://www.gravatar.com/avatar/?d=mp"} className="w-10 h-10 rounded-full border border-white/10 object-cover" alt={u.nome} />
                     <div className="flex flex-col overflow-hidden">
                       <span className="text-xs font-black text-white truncate">{u.nome}</span>
                       <span className="text-[9px] text-gray-500 truncate">{u.email}</span>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                     {isMembro ? (
                       <button onClick={() => removerMembro(u.email)} className="flex-1 bg-green-900/20 text-green-500 border border-green-900/30 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-900/30 hover:text-red-500 hover:border-red-900/50 transition-all">Autorizado</button>
                     ) : (
                       <button onClick={() => autorizarUsuario(u.email)} className="flex-1 bg-white/5 text-gray-400 border border-white/10 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-green-600 hover:text-white hover:border-green-500 transition-all shadow-md">Liberar</button>
                     )}
                     
                     {isAdminUser ? (
                       <button onClick={() => removerAdmin(u.email)} className="flex-1 bg-red-900/20 text-red-500 border border-red-900/30 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black hover:text-gray-500 transition-all">É Admin</button>
                     ) : (
                       <button onClick={() => promoverAdminUsuario(u.email)} className="flex-1 bg-white/5 text-gray-400 border border-white/10 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 hover:text-white hover:border-red-500 transition-all">Poderes</button>
                     )}
                   </div>
                </div>
              )
            })}
            
            {usuariosFiltrados.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-600 text-xs italic font-bold">
                Nenhum usuário encontrado na busca.
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}