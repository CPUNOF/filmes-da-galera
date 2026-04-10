import Link from "next/link";
import Navbar from "@/components/Navbar";
import AreaVotacao from "@/components/AreaVotacao";
import AreaUpvote from "@/components/AreaUpvote";
import BotaoAdmin from "@/components/BotaoAdmin"; 
import AreaComentarios from "@/components/AreaComentarios"; 
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function obterVeredito(notaGeral) {
  if (notaGeral === 0) return { texto: "Sem nota", cor: "text-gray-500 border-gray-500" };
  if (notaGeral <= 3) return { texto: "Lixo 🗑️", cor: "text-red-500 border-red-500" };
  if (notaGeral <= 5) return { texto: "Ruim 👎", cor: "text-orange-400 border-orange-400" };
  if (notaGeral <= 7) return { texto: "Legalzinho 🆗", cor: "text-yellow-400 border-yellow-400" };
  if (notaGeral <= 9) return { texto: "Muito Bom 👍", cor: "text-blue-400 border-blue-400" };
  return { texto: "Ótimo 🏆", cor: "text-green-400 border-green-400" };
}

function formatarDataBR(dataISO) {
  if (!dataISO) return null;
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'UTC' }); 
}

export default async function FilmePage({ params }) {
  const { id } = await params;
  const filmeRef = doc(db, "filmes", id);
  const filmeSnap = await getDoc(filmeRef);

  if (!filmeSnap.exists()) return <main className="min-h-screen bg-black text-white p-8">Filme não encontrado.</main>;

  const filme = { id: filmeSnap.id, ...filmeSnap.data() };
  const veredito = obterVeredito(filme.notaGeral || 0);
  const isSugestao = filme.status === "sugerido";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20 overflow-x-hidden">
      
      {/* 🎬 HEADER IMERSIVO (Backdrop) - Mais alto no mobile */}
      <div className="relative w-full h-[55vh] sm:h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center scale-110 blur-xl opacity-30"
          style={{ backgroundImage: `url(${filme.capa})` }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/80"></div>
        
        {/* Usamos max-w-[1400px] para a Navbar e Backlink */}
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 h-full flex flex-col pt-6 sm:pt-10">
          <Navbar />
          
          <Link href="/" className="text-gray-400 hover:text-white mb-8 inline-flex items-center gap-2 transition-colors text-sm font-bold uppercase tracking-widest">
            &larr; Voltar para a Galeria
          </Link>

          {/* TRAILER CENTRALIZADO - Agora Aumentado para ocupar a tela */}
          <div className="flex-1 w-full flex items-center justify-center mb-12">
            {filme.trailerKey ? (
              // Removemos max-w-4xl e usamos w-full para o vídeo explodir na tela
              <div className="w-full max-w-7xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 relative z-30">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${filme.trailerKey}?autoplay=0&controls=1&rel=0&modestbranding=1`}
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="w-full max-w-4xl aspect-video bg-gray-900/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-dashed border-white/20 relative z-30">
                <p className="text-gray-500 italic">Trailer indisponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📝 CONTEÚDO PRINCIPAL (MUDAMOS max-w-6xl para max-w-[1400px]) */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-16 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Coluna Esquerda: Info e Sinopse (Ajustamos col-span) */}
          <div className="lg:col-span-8">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 leading-none">
              {filme.titulo}
            </h1>

            {/* Badges de Gênero */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filme.generos?.map((g) => (
                <span key={g} className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {g}
                </span>
              ))}
              {filme.dataLancamento && (
                 <span className="bg-red-600/20 border border-red-600/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400">
                  {filme.dataLancamento.substring(0,4)}
                </span>
              )}
            </div>

            {/* Mudamos p-8 para p-6 ou p-5 no mobile */}
            <div className="bg-[#141414] p-5 sm:p-8 rounded-3xl border border-white/5 shadow-2xl">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.3em] mb-4">Sinopse</h2>
              <p className="text-gray-300 text-lg leading-relaxed font-medium">
                {filme.sinopse}
              </p>
            </div>
          </div>

          {/* Coluna Direita (Ajustamos col-span e padding) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CAIXA DE VOTAÇÃO */}
            <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-6">
              
              {!isSugestao ? (
                <>
                  <h4 className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>⭐</span> Avaliação do Grupo
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Média Atual</span>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white">{filme.notaGeral}</span>
                        <span className="text-gray-600 mb-1 font-bold">/ 10</span>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest ${veredito.cor}`}>
                      {veredito.texto}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <AreaVotacao filmeId={filme.id} />
                  </div>

                  {filme.dataAssistido && (
                    <div className="pt-4 border-t border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
                      Assistido em {formatarDataBR(filme.dataAssistido)}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h4 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                    <span>🔥</span> Subir na Fila
                  </h4>
                  <div className="mb-2">
                    <p className="text-xs text-gray-400 mt-1">Quer muito assistir esse filme? Deixe seu voto!</p>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <AreaUpvote filmeId={filme.id} />
                  </div>
                </>
              )}
            </div>

            {/* CAIXA DO ADMIN */}
            <BotaoAdmin filmeId={filme.id} isSugestao={isSugestao} dataAssistidoAtual={filme.dataAssistido} />
          </div>

        </div>

        {/* 💬 ÁREA DE COMENTÁRIOS NO FINAL - Aumentada para acompanhar o layout */}
        <div className="mt-24 pt-12 border-t border-white/10">
          <AreaComentarios filmeId={filme.id} />
        </div>

      </div>
    </main>
  );
}