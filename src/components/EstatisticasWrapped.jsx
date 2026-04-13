"use client";

import { useMemo, useState } from "react";

export default function EstatisticasWrapped({ itensCultura, filmesComNotas }) {
  const [modalAberto, setModalAberto] = useState(null); 

  const estatisticas = useMemo(() => {
    const livros = itensCultura.filter(i => i.tipo === 'Livro').reduce((a, c) => a + Number(c.progresso || 0), 0);
    const mangas = itensCultura.filter(i => i.tipo === 'Mangá').reduce((a, c) => a + Number(c.progresso || 0), 0);
    const paginasLidas = livros + mangas;

    const epsSeries = itensCultura.filter(i => i.tipo === 'Série').reduce((a, c) => a + Number(c.progresso || 0), 0);
    const epsAnimes = itensCultura.filter(i => i.tipo === 'Anime').reduce((a, c) => a + Number(c.progresso || 0), 0);
    
    const horasSeries = Math.floor((epsSeries * 45) / 60); 
    const horasAnimes = Math.floor((epsAnimes * 24) / 60); 
    const horasFilmes = Math.floor(((filmesComNotas?.length || 0) * 120) / 60); 
    const horasTela = horasSeries + horasAnimes + horasFilmes;

    const musicas = itensCultura.filter(i => i.tipo === 'Música' && i.artista);
    const contagemArtistas = {};
    musicas.forEach(m => contagemArtistas[m.artista] = (contagemArtistas[m.artista] || 0) + 1);
    
    const topArtistas = Object.keys(contagemArtistas)
      .map(k => ({ nome: k, count: contagemArtistas[k] }))
      .sort((a, b) => b.count - a.count);
      
    const artistaTop = topArtistas.length > 0 ? topArtistas[0].nome : "Nenhum";

    const listaOuro = itensCultura.filter(i => i.tier === 'S');

    return { 
      paginasLidas, livros, mangas,
      horasTela, horasSeries, horasAnimes, horasFilmes,
      artistaTop, topArtistas,
      obrasPrimas: listaOuro.length, listaOuro 
    };
  }, [itensCultura, filmesComNotas]);

  if (estatisticas.paginasLidas === 0 && estatisticas.horasTela === 0 && estatisticas.artistaTop === "Nenhum") {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-2 sm:mb-3 px-2">
        <span className="text-lg sm:text-xl animate-pulse">✨</span>
        <h2 className="text-[12px] sm:text-[14px] font-black uppercase tracking-widest text-white italic drop-shadow-md">
          O Teu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Resumo Cultural</span>
        </h2>
      </div>

      {/* 🪄 CARROUSSEL DE ESTATÍSTICAS ACHATADO PARA MOBILE */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-3 pb-2 snap-x snap-mandatory px-2 sm:px-0">
        
        {/* CARD 1: TELA */}
        <div onClick={() => setModalAberto('tela')} className="relative overflow-hidden bg-gradient-to-br from-purple-900/80 to-[#0a0a0a] border border-purple-500/30 rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 shrink-0 w-[140px] sm:w-[200px] sm:flex-1 snap-center shadow-lg group hover:border-purple-400 transition-all cursor-pointer min-h-[75px] sm:min-h-[110px] flex flex-col justify-between">
          <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 text-4xl sm:text-6xl opacity-10 group-hover:scale-110 transition-transform">📺</div>
          <span className="bg-purple-500/20 text-purple-300 text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md border border-purple-500/30 inline-block w-fit">Tempo de Ecrã</span>
          <div className="flex flex-col mt-1 sm:mt-0">
            <span className="text-xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md leading-none mb-0.5 sm:mb-1">{estatisticas.horasTela} <span className="text-[9px] sm:text-sm text-purple-400">Hrs</span></span>
            <span className="text-[6px] sm:text-[8px] text-gray-400 uppercase font-bold tracking-widest">Ver Detalhes ➔</span>
          </div>
        </div>

        {/* CARD 2: LEITURA */}
        <div onClick={() => setModalAberto('leitura')} className="relative overflow-hidden bg-gradient-to-br from-emerald-900/80 to-[#0a0a0a] border border-emerald-500/30 rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 shrink-0 w-[140px] sm:w-[200px] sm:flex-1 snap-center shadow-lg group hover:border-emerald-400 transition-all cursor-pointer min-h-[75px] sm:min-h-[110px] flex flex-col justify-between">
          <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 text-4xl sm:text-6xl opacity-10 group-hover:scale-110 transition-transform">📚</div>
          <span className="bg-emerald-500/20 text-emerald-300 text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-500/30 inline-block w-fit">Leitura</span>
          <div className="flex flex-col mt-1 sm:mt-0">
            <span className="text-xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md leading-none mb-0.5 sm:mb-1">{estatisticas.paginasLidas}</span>
            <span className="text-[6px] sm:text-[8px] text-gray-400 uppercase font-bold tracking-widest">Ver Detalhes ➔</span>
          </div>
        </div>

        {/* CARD 3: ARTISTA */}
        <div onClick={() => setModalAberto('artista')} className="relative overflow-hidden bg-gradient-to-br from-pink-900/80 to-[#0a0a0a] border border-pink-500/30 rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 shrink-0 w-[140px] sm:w-[200px] sm:flex-1 snap-center shadow-lg group hover:border-pink-400 transition-all cursor-pointer min-h-[75px] sm:min-h-[110px] flex flex-col justify-between">
          <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 text-4xl sm:text-6xl opacity-10 group-hover:scale-110 transition-transform">🎵</div>
          <span className="bg-pink-500/20 text-pink-300 text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md border border-pink-500/30 inline-block w-fit">Top Artista</span>
          <div className="flex flex-col mt-1 sm:mt-0">
            <span className="text-sm sm:text-2xl font-black text-white tracking-tighter drop-shadow-md truncate leading-none mb-0.5 sm:mb-1">{estatisticas.artistaTop}</span>
            <span className="text-[6px] sm:text-[8px] text-gray-400 uppercase font-bold tracking-widest">Ver Rankings ➔</span>
          </div>
        </div>

        {/* CARD 4: OURO */}
        <div onClick={() => setModalAberto('ouro')} className="relative overflow-hidden bg-gradient-to-br from-yellow-900/80 to-[#0a0a0a] border border-yellow-500/30 rounded-xl sm:rounded-[1.5rem] p-3 sm:p-4 shrink-0 w-[140px] sm:w-[200px] sm:flex-1 snap-center shadow-lg group hover:border-yellow-400 transition-all cursor-pointer min-h-[75px] sm:min-h-[110px] flex flex-col justify-between">
          <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4 text-4xl sm:text-6xl opacity-10 group-hover:scale-110 transition-transform">🏆</div>
          <span className="bg-yellow-500/20 text-yellow-300 text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-md border border-yellow-500/30 inline-block w-fit">Padrão Ouro</span>
          <div className="flex flex-col mt-1 sm:mt-0">
            <span className="text-xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-md leading-none mb-0.5 sm:mb-1">{estatisticas.obrasPrimas} <span className="text-[9px] sm:text-sm text-yellow-400">Obras</span></span>
            <span className="text-[6px] sm:text-[8px] text-gray-400 uppercase font-bold tracking-widest">Ver Tier S ➔</span>
          </div>
        </div>
      </div>

      {/* MODAIS (Permanece Intacto) */}
      {modalAberto && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setModalAberto(null)}>
          <div className="bg-[#111] border border-white/10 rounded-[2rem] w-full max-w-md p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalAberto(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 text-gray-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all font-black">✕</button>
            
            {modalAberto === 'tela' && (
              <>
                <h3 className="text-xl font-black uppercase italic text-white mb-1"><span className="text-purple-500">📺 Tempo</span> de Ecrã</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">Onde gastaste as tuas {estatisticas.horasTela} horas?</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-blue-400">Filmes</span><span className="text-white">{estatisticas.horasFilmes} Hrs</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{width: `${(estatisticas.horasFilmes/estatisticas.horasTela)*100}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-purple-400">Séries</span><span className="text-white">{estatisticas.horasSeries} Hrs</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{width: `${(estatisticas.horasSeries/estatisticas.horasTela)*100}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-orange-400">Animes</span><span className="text-white">{estatisticas.horasAnimes} Hrs</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-orange-500 h-full rounded-full" style={{width: `${(estatisticas.horasAnimes/estatisticas.horasTela)*100}%`}}></div></div>
                  </div>
                </div>
              </>
            )}

            {modalAberto === 'leitura' && (
              <>
                <h3 className="text-xl font-black uppercase italic text-white mb-1"><span className="text-emerald-500">📚 Hábito</span> de Leitura</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">Detalhe das {estatisticas.paginasLidas} páginas</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-emerald-400">Livros</span><span className="text-white">{estatisticas.livros} Pág</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full rounded-full" style={{width: `${(estatisticas.livros/estatisticas.paginasLidas)*100}%`}}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold uppercase mb-1"><span className="text-red-400">Mangás / HQs</span><span className="text-white">{estatisticas.mangas} Pág</span></div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden"><div className="bg-red-500 h-full rounded-full" style={{width: `${(estatisticas.mangas/estatisticas.paginasLidas)*100}%`}}></div></div>
                  </div>
                </div>
              </>
            )}

            {modalAberto === 'artista' && (
              <>
                <h3 className="text-xl font-black uppercase italic text-white mb-1"><span className="text-pink-500">🎵 Top</span> Artistas</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">Os mais guardados na playlist</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {estatisticas.topArtistas.length > 0 ? estatisticas.topArtistas.map((art, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs font-black uppercase text-white truncate max-w-[200px]"><span className="text-pink-500 mr-2">{i+1}º</span>{art.nome}</span>
                      <span className="text-[10px] font-bold text-gray-400 bg-black/40 px-2 py-1 rounded-md">{art.count} Faixas</span>
                    </div>
                  )) : <p className="text-center text-xs text-gray-500 font-bold uppercase">Sem músicas.</p>}
                </div>
              </>
            )}

            {modalAberto === 'ouro' && (
              <>
                <h3 className="text-xl font-black uppercase italic text-white mb-1"><span className="text-yellow-500">🏆 Obras</span> Primas</h3>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-6">Tudo o que avaliou como Tier S</p>
                <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  {estatisticas.listaOuro.length > 0 ? estatisticas.listaOuro.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-gradient-to-r from-yellow-900/20 to-transparent rounded-xl border border-yellow-500/20">
                      <img src={item.capa} className="w-10 h-14 object-cover rounded-md border border-yellow-500/30" alt="" />
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">{item.tipo}</span>
                        <span className="text-xs font-black text-white uppercase truncate">{item.titulo}</span>
                      </div>
                    </div>
                  )) : <p className="text-center text-xs text-gray-500 font-bold uppercase">Sem obras Tier S.</p>}
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}