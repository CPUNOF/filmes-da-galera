"use client";

export default function QuadroMedalhas({ filmesComNotas, indicacoes, comentarios, diarioPessoal, upvoted, itensCultura, dadosGamer }) {
  // CÁLCULO DE TODAS AS MEDALHAS
  const isCult = (filmesComNotas.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length + indicacoes.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length) >= 3;
  const isHater = filmesComNotas.filter(f => f.notaDoUsuario < 5).length >= 3;
  const isTagarela = comentarios.length >= 10;
  const isVisionario = indicacoes.some(f => f.status === "assistido" && Number(f.notaGeral) >= 9.0);
  const isInfluenciador = comentarios.reduce((acc, c) => acc + (c.likes?.length || 0), 0) >= 5; 
  const isCurador = indicacoes.filter(f => f.status === "assistido").length >= 3;
  const isMagnata = dadosGamer.ingressos >= 3; 
  const isExplorador = diarioPessoal.length >= 10; 
  const isVozDoPovo = comentarios.some(c => c.likes?.length >= 5); 
  const isMestreFila = upvoted.length >= 10; 
  const isCinefiloExtremo = filmesComNotas.length >= 20; 

  const isOtaku = itensCultura.filter(i => i.tipo === 'Anime' || i.tipo === 'Mangá').length >= 3;
  const isRatoDeBiblioteca = itensCultura.filter(i => i.tipo === 'Livro').length >= 3;
  const isMaratonista = itensCultura.filter(i => i.tipo === 'Série').length >= 3;
  const isMelomano = itensCultura.filter(i => i.tipo === 'Música').length >= 5;
  const isEcletico = (diarioPessoal.length > 0 || indicacoes.length > 0) && itensCultura.some(i=>i.tipo==='Série') && itensCultura.some(i=>i.tipo==='Livro') && itensCultura.some(i=>i.tipo==='Música');
  const isApoiadorOuro = upvoted.length >= 20;

  return (
    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3 pt-3 border-t border-white/10 w-fit">
      {isOtaku && <div className="bg-orange-900/30 border border-orange-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5" title="Mais de 3 Animes/Mangás"><span className="text-sm">🎌</span><span className="text-[8px] font-black uppercase text-orange-500">Otaku</span></div>}
      {isRatoDeBiblioteca && <div className="bg-emerald-900/30 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5" title="Mais de 3 Livros"><span className="text-sm">📚</span><span className="text-[8px] font-black uppercase text-emerald-500">Rato de Biblioteca</span></div>}
      {isMaratonista && <div className="bg-purple-900/30 border border-purple-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5" title="Mais de 3 Séries"><span className="text-sm">📺</span><span className="text-[8px] font-black uppercase text-purple-500">Maratonista</span></div>}
      {isMelomano && <div className="bg-pink-900/30 border border-pink-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5" title="Mais de 5 Músicas"><span className="text-sm">🎧</span><span className="text-[8px] font-black uppercase text-pink-500">Melômano</span></div>}
      {isEcletico && <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-indigo-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🌟</span><span className="text-[8px] font-black uppercase text-indigo-400">Eclético</span></div>}
      {isApoiadorOuro && <div className="bg-yellow-900/30 border border-yellow-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🤝</span><span className="text-[8px] font-black uppercase text-yellow-500">Apoiador</span></div>}
      {isVisionario && <div className="bg-yellow-900/30 border border-yellow-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🎯</span><span className="text-[8px] font-black uppercase text-yellow-500">Visionário</span></div>}
      {isInfluenciador && <div className="bg-pink-900/30 border border-pink-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🌟</span><span className="text-[8px] font-black uppercase text-pink-500">Influencer</span></div>}
      {isCurador && <div className="bg-purple-900/30 border border-purple-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🏛️</span><span className="text-[8px] font-black uppercase text-purple-400">Curador</span></div>}
      {isMagnata && <div className="bg-amber-900/30 border border-amber-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">💰</span><span className="text-[8px] font-black uppercase text-amber-500">Magnata</span></div>}
      {isMestreFila && <div className="bg-orange-900/30 border border-orange-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🎟️</span><span className="text-[8px] font-black uppercase text-orange-500">Mestre Fila</span></div>}
      {isCinefiloExtremo && <div className="bg-red-900/30 border border-red-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">🏆</span><span className="text-[8px] font-black uppercase text-red-500">Cinéfilo Extremo</span></div>}
      {isExplorador && <div className="bg-cyan-900/30 border border-cyan-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">📓</span><span className="text-[8px] font-black uppercase text-cyan-400">Explorador</span></div>}
      {isCult && <div className="bg-stone-800/60 border border-stone-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">👴</span><span className="text-[8px] font-black uppercase text-stone-400">Cult</span></div>}
      {isHater && <div className="bg-rose-900/30 border border-rose-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">😡</span><span className="text-[8px] font-black uppercase text-rose-500">Hater</span></div>}
      {isTagarela && <div className="bg-blue-900/30 border border-blue-500/40 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5"><span className="text-sm">✍️</span><span className="text-[8px] font-black uppercase text-blue-500">Tagarela</span></div>}
    </div>
  );
}