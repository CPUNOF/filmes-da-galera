"use client";

import { useState } from "react";
import { useAdmin } from "../lib/useAdmin";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // 👈 Não esqueça de importar o toast!

export default function BotaoAdmin({ filmeId, isSugestao, dataAssistidoAtual }) {
  const { isAdmin, carregandoAdmin } = useAdmin();
  const router = useRouter();
  const dataFormatada = dataAssistidoAtual ? dataAssistidoAtual.split('T')[0] : "";
  const [novaData, setNovaData] = useState(dataFormatada);

  if (carregandoAdmin || !isAdmin) return null;

  // Função para salvar data
  const salvarDataManual = async () => {
    if (!novaData) return toast.error("Escolha uma data primeiro!");
    const dataISO = new Date(novaData + "T12:00:00Z").toISOString();
    await updateDoc(doc(db, "filmes", filmeId), { dataAssistido: dataISO });
    toast.success("Data atualizada!");
    setTimeout(() => window.location.reload(), 1000);
  };

  // 🪄 O NOVO CONFIRM DO STATUS (Feito com Toast)
  const pedirConfirmacaoStatus = (novoStatus) => {
    const msg = novoStatus === "assistido" ? "Mover para Assistidos?" : "Voltar para a Fila?";
    
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-bold text-white">{msg}</span>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id); // Fecha o toast
              const dados = { status: novoStatus };
              if (novoStatus === "assistido" && !dataAssistidoAtual) dados.dataAssistido = new Date().toISOString();
              await updateDoc(doc(db, "filmes", filmeId), dados);
              toast.success("Status atualizado!");
              setTimeout(() => window.location.reload(), 1000);
            }}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    ), { duration: 8000 }); // Fica na tela por 8 segundos para dar tempo de clicar
  };

  // 🪄 O NOVO CONFIRM DE EXCLUSÃO (Feito com Toast)
  const pedirConfirmacaoExclusao = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-bold text-white">Tem certeza que deseja apagar para sempre?</span>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id); // Fecha o toast
              await deleteDoc(doc(db, "filmes", filmeId));
              toast.success("Filme excluído!");
              router.push("/");
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20"
          >
            Sim, Apagar
          </button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  return (
    <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
      <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
        <span>👑</span> Painel do Administrador
      </h4>

      {!isSugestao && (
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data da Sessão</label>
          <div className="flex flex-col gap-2">
            <input 
              type="date" 
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="bg-black/40 text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-red-500 w-full text-sm font-bold"
            />
            <button 
              onClick={salvarDataManual}
              className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-white/10 transition-all"
            >
              Atualizar Data
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
        <button 
          onClick={() => pedirConfirmacaoStatus(isSugestao ? "assistido" : "sugerido")}
          className="bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/20 text-[9px] font-black uppercase tracking-tighter py-3 rounded-xl transition-all"
        >
          {isSugestao ? "Marcar Assistido" : "Voltar p/ Fila"}
        </button>

        <button 
          onClick={pedirConfirmacaoExclusao}
          className="bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-tighter py-3 rounded-xl transition-all"
        >
          Excluir Filme
        </button>
      </div>
    </div>
  );
}