"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useAdmin } from "../../lib/useAdmin";
import { db } from "../../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function PainelAdmin() {
  const { isAdmin, carregandoAdmin } = useAdmin();
  const [emailNovoAdmin, setEmailNovoAdmin] = useState("");
  const [listaAdmins, setListaAdmins] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Função para ler o banco e listar quem é Admin
  const buscarAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "admins"));
      const admins = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().ativo) admins.push(doc.id);
      });
      setListaAdmins(admins);
    } catch (error) {
      console.error("Erro ao buscar admins:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Só busca a lista se tiver certeza que o cara logado é admin
  useEffect(() => {
    if (isAdmin) {
      buscarAdmins();
    }
  }, [isAdmin]);

  // Função para dar poderes a um amigo
  const adicionarAdmin = async (e) => {
    e.preventDefault();
    if (!emailNovoAdmin) return;
    
    try {
      // Cria/Atualiza o documento com o e-mail exato da pessoa
      await setDoc(doc(db, "admins", emailNovoAdmin.toLowerCase().trim()), { ativo: true });
      setEmailNovoAdmin("");
      buscarAdmins(); // Atualiza a lista na tela na hora
      alert("Poderes concedidos! Seu amigo agora é um Administrador.");
    } catch (error) {
      console.error("Erro ao adicionar admin", error);
      alert("Falha ao promover o usuário.");
    }
  };

  // Função para arrancar os poderes de alguém
  const removerAdmin = async (email) => {
    if (confirm(`Atenção: Deseja retirar os poderes de administrador de ${email}?`)) {
      try {
        await deleteDoc(doc(db, "admins", email));
        buscarAdmins();
      } catch (error) {
        alert("Erro ao rebaixar usuário.");
      }
    }
  };

  // Se o Next.js ainda está pensando se o cara é admin ou não
  if (carregandoAdmin) return <main className="min-h-screen bg-gray-900 text-white p-8"><Navbar /></main>;

  // O ESCUDO DE PROTEÇÃO: Se não for Admin, mostra a tela de Acesso Negado
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <Navbar />
        <div className="max-w-2xl mx-auto text-center mt-32 bg-gray-800 p-10 rounded-xl border border-red-900/50">
          <span className="text-6xl mb-4 block">🛑</span>
          <h1 className="text-3xl text-red-500 font-bold mb-4">Acesso Restrito</h1>
          <p className="text-gray-400 mb-8">Esta é uma área confidencial destinada apenas aos Deuses do Sistema.</p>
          <button onClick={() => router.push('/')} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-md font-bold transition-colors">
            Retornar à Galeria
          </button>
        </div>
      </main>
    );
  }

  // SE CHEGOU AQUI, É O CHEFE! Mostra o painel verdadeiro:
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <Navbar />
      
      <div className="max-w-4xl mx-auto mt-6">
        <h2 className="text-3xl font-bold mb-8 text-red-500 border-l-4 border-red-500 pl-3 flex items-center gap-2">
          <span>⚙️</span> Central de Comando
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Formulário de Adicionar */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl h-fit">
            <h3 className="text-xl font-bold mb-2">Promover Administrador</h3>
            <p className="text-sm text-gray-400 mb-6">Digite o e-mail Google do usuário para conceder privilégios totais no sistema.</p>
            
            <form onSubmit={adicionarAdmin} className="flex flex-col gap-4">
              <input 
                type="email" 
                required
                value={emailNovoAdmin}
                onChange={(e) => setEmailNovoAdmin(e.target.value)}
                placeholder="email.do.amigo@gmail.com" 
                className="bg-gray-900 border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:border-red-500"
              />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-colors w-full">
                Dar Poderes
              </button>
            </form>
          </div>

          {/* Lista de Admins Atuais */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Lista VIP Atual</h3>
            
            {carregando ? (
              <p className="text-gray-500">Buscando dados no cofre...</p>
            ) : (
              <ul className="divide-y divide-gray-700">
                {listaAdmins.map(email => (
                  <li key={email} className="py-4 flex justify-between items-center gap-4">
                    <span className="font-medium text-gray-300 truncate">{email}</span>
                    <button 
                      onClick={() => removerAdmin(email)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-900 bg-red-900/20 px-3 py-2 rounded uppercase tracking-wider"
                    >
                      Rebaixar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}