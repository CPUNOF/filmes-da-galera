"use client";

import { useState, useMemo } from "react";

export default function QuadroMedalhas({ 
  filmesComNotas = [], 
  indicacoes = [], 
  comentarios = [], 
  diarioPessoal = [], 
  upvoted = [], 
  itensCultura = [], 
  dadosGamer = {} 
}) {
  const [medalhaAtiva, setMedalhaAtiva] = useState(null);
  const [mostrarBloqueadas, setMostrarBloqueadas] = useState(false);

  // 🪄 CÁLCULO DE TODAS AS SUAS MEDALHAS ORIGINAIS COM PROGRESSO REAL!
  const medalhas = useMemo(() => {
    const cultCount = filmesComNotas.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length + indicacoes.filter(f => parseInt(f.dataLancamento?.substring(0, 4)) < 1990).length;
    const haterCount = filmesComNotas.filter(f => f.notaDoUsuario < 5).length;
    const tagarelaCount = comentarios.length;
    const visionarioCount = indicacoes.filter(f => f.status === "assistido" && Number(f.notaGeral) >= 9.0).length;
    const influencerCount = comentarios.reduce((acc, c) => acc + (c.likes?.length || 0), 0);
    const curadorCount = indicacoes.filter(f => f.status === "assistido").length;
    const magnataCount = dadosGamer.ingressos || 0;
    const exploradorCount = diarioPessoal.length;
    const mestreFilaCount = upvoted.length;
    const cinefiloExtremoCount = filmesComNotas.length;
    const otakuCount = itensCultura.filter(i => i.tipo === 'Anime' || i.tipo === 'Mangá').length;
    const ratoBibliotecaCount = itensCultura.filter(i => i.tipo === 'Livro').length;
    const maratonistaCount = itensCultura.filter(i => i.tipo === 'Série').length;
    const melomanoCount = itensCultura.filter(i => i.tipo === 'Música').length;
    
    const temFilme = diarioPessoal.length > 0 || indicacoes.length > 0 ? 1 : 0;
    const temSerie = itensCultura.some(i => i.tipo === 'Série') ? 1 : 0;
    const temLivro = itensCultura.some(i => i.tipo === 'Livro') ? 1 : 0;
    const temMusica = itensCultura.some(i => i.tipo === 'Música') ? 1 : 0;
    const ecleticoCount = temFilme + temSerie + temLivro + temMusica;

    return [
      { id: 'otaku', icone: '🎌', nome: 'Otaku', cor: 'orange', desc: 'Adicione 3 Animes ou Mangás à sua coleção.', progresso: `${Math.min(otakuCount, 3)}/3`, desbloqueada: otakuCount >= 3 },
      { id: 'rato_biblioteca', icone: '📚', nome: 'Rato de Biblioteca', cor: 'emerald', desc: 'Adicione 3 Livros à sua cabeceira.', progresso: `${Math.min(ratoBibliotecaCount, 3)}/3`, desbloqueada: ratoBibliotecaCount >= 3 },
      { id: 'maratonista', icone: '📺', nome: 'Maratonista', cor: 'purple', desc: 'Adicione 3 Séries de TV à sua lista.', progresso: `${Math.min(maratonistaCount, 3)}/3`, desbloqueada: maratonistaCount >= 3 },
      { id: 'melomano', icone: '🎧', nome: 'Melômano', cor: 'pink', desc: 'Adicione 5 Músicas à sua playlist global.', progresso: `${Math.min(melomanoCount, 5)}/5`, desbloqueada: melomanoCount >= 5 },
      { id: 'ecletico', icone: '🌟', nome: 'Eclético', cor: 'indigo', desc: 'Tenha Filmes, Séries, Livros e Músicas no perfil.', progresso: `${ecleticoCount}/4`, desbloqueada: ecleticoCount >= 4 },
      { id: 'apoiador', icone: '🤝', nome: 'Apoiador Ouro', cor: 'yellow', desc: 'Vote em 20 filmes na fila da galera.', progresso: `${Math.min(mestreFilaCount, 20)}/20`, desbloqueada: mestreFilaCount >= 20 },
      { id: 'visionario', icone: '🎯', nome: 'Visionário', cor: 'yellow', desc: 'Indique 1 obra que alcance nota geral 9.0+ da galera.', progresso: `${Math.min(visionarioCount, 1)}/1`, desbloqueada: visionarioCount >= 1 },
      { id: 'influenciador', icone: '💖', nome: 'Influencer', cor: 'pink', desc: 'Receba 5 curtidas acumuladas nas suas resenhas.', progresso: `${Math.min(influencerCount, 5)}/5`, desbloqueada: influencerCount >= 5 },
      { id: 'curador', icone: '🏛️', nome: 'Curador', cor: 'purple', desc: 'Tenha 3 das suas indicações já assistidas pela galera.', progresso: `${Math.min(curadorCount, 3)}/3`, desbloqueada: curadorCount >= 3 },
      { id: 'magnata', icone: '💰', nome: 'Magnata', cor: 'amber', desc: 'Acumule 3 Ingressos Dourados na sua conta VIP.', progresso: `${Math.min(magnataCount, 3)}/3`, desbloqueada: magnataCount >= 3 },
      { id: 'mestre_fila', icone: '🎟️', nome: 'Mestre Fila', cor: 'orange', desc: 'Vote em 10 indicações que estão na fila de espera.', progresso: `${Math.min(mestreFilaCount, 10)}/10`, desbloqueada: mestreFilaCount >= 10 },
      { id: 'cinefilo_extremo', icone: '🏆', nome: 'Cinéfilo Extremo', cor: 'red', desc: 'Avalie 20 filmes com nota.', progresso: `${Math.min(cinefiloExtremoCount, 20)}/20`, desbloqueada: cinefiloExtremoCount >= 20 },
      { id: 'explorador', icone: '📓', nome: 'Explorador', cor: 'cyan', desc: 'Adicione 10 filmes ao seu diário pessoal.', progresso: `${Math.min(exploradorCount, 10)}/10`, desbloqueada: exploradorCount >= 10 },
      { id: 'cult', icone: '👴', nome: 'Cult', cor: 'stone', desc: 'Avalie ou indique 3 obras clássicas (lançadas antes de 1990).', progresso: `${Math.min(cultCount, 3)}/3`, desbloqueada: cultCount >= 3 },
      { id: 'hater', icone: '😡', nome: 'Hater', cor: 'rose', desc: 'Dê uma nota abaixo de 5 para pelo menos 3 filmes.', progresso: `${Math.min(haterCount, 3)}/3`, desbloqueada: haterCount >= 3 },
      { id: 'tagarela', icone: '✍️', nome: 'Tagarela', cor: 'blue', desc: 'Escreva 10 resenhas ou comentários.', progresso: `${Math.min(tagarelaCount, 10)}/10`, desbloqueada: tagarelaCount >= 10 }
    ];
  }, [filmesComNotas, indicacoes, comentarios, diarioPessoal, upvoted, itensCultura, dadosGamer]);

  const desbloqueadas = medalhas.filter(m => m.desbloqueada);
  const bloqueadas = medalhas.filter(m => !m.desbloqueada);

  // Mapeamento seguro das suas cores originais para não bugar no Tailwind
  const getEstilo = (cor, isDesbloqueada) => {
    if (!isDesbloqueada) return "bg-black/40 border border-white/5 text-gray-500 opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all";
    
    const estilos = {
      orange: "bg-orange-900/30 border border-orange-500/40 text-orange-500",
      emerald: "bg-emerald-900/30 border border-emerald-500/40 text-emerald-500",
      purple: "bg-purple-900/30 border border-purple-500/40 text-purple-400",
      pink: "bg-pink-900/30 border border-pink-500/40 text-pink-500",
      indigo: "bg-indigo-900/30 border border-indigo-500/40 text-indigo-400",
      yellow: "bg-yellow-900/30 border border-yellow-500/40 text-yellow-500",
      amber: "bg-amber-900/30 border border-amber-500/40 text-amber-500",
      red: "bg-red-900/30 border border-red-500/40 text-red-500",
      cyan: "bg-cyan-900/30 border border-cyan-500/40 text-cyan-400",
      stone: "bg-stone-800/60 border border-stone-500/40 text-stone-400",
      rose: "bg-rose-900/30 border border-rose-500/40 text-rose-500",
      blue: "bg-blue-900/30 border border-blue-500/40 text-blue-500"
    };
    return estilos[cor] || estilos.blue;
  };

  return (
    <div className="mt-4 border-t border-white/5 pt-3">
      
      {/* 🪄 AS SUAS MEDALHAS ORIGINAIS (Flex Wrap) */}
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-fit mx-auto sm:mx-0">
        
        {/* Renderiza apenas as que tem */}
        {desbloqueadas.map(m => (
          <button 
            key={m.id} 
            onClick={() => setMedalhaAtiva(medalhaAtiva?.id === m.id ? null : m)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-105 ${getEstilo(m.cor, true)} ${medalhaAtiva?.id === m.id ? 'ring-1 ring-white/30' : ''}`}
          >
            <span className="text-sm">{m.icone}</span> 
            <span>{m.nome}</span>
          </button>
        ))}

        {/* Botão de Revelar Bloqueadas */}
        {bloqueadas.length > 0 && (
          <button 
            onClick={() => setMostrarBloqueadas(!mostrarBloqueadas)}
            className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
          >
            <span>{mostrarBloqueadas ? "Ocultar 🔒" : `+${bloqueadas.length} Bloqueadas`}</span>
          </button>
        )}

        {/* Renderiza as bloqueadas apenas se clicou no botão */}
        {mostrarBloqueadas && bloqueadas.map(m => (
          <button 
            key={m.id} 
            onClick={() => setMedalhaAtiva(medalhaAtiva?.id === m.id ? null : m)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-105 ${getEstilo(m.cor, false)} ${medalhaAtiva?.id === m.id ? 'ring-1 ring-white/30' : ''}`}
          >
            <span className="text-sm">{m.icone}</span> 
            <span>{m.nome}</span>
          </button>
        ))}
      </div>

      {/* 🪄 CAIXA DE INFORMAÇÃO DISCRETA E ELEGANTE (Abre ao clicar) */}
      {medalhaAtiva && (
        <div className="mt-3 p-3 bg-[#0a0a0a] border border-white/10 rounded-xl flex items-center justify-between gap-4 animate-fade-in-up shadow-xl relative overflow-hidden max-w-sm mx-auto sm:mx-0">
          
          <div className="flex flex-col relative z-10 w-full pr-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white text-[10px] font-black uppercase flex items-center gap-1">
                {medalhaAtiva.icone} {medalhaAtiva.nome}
              </span>
              {!medalhaAtiva.desbloqueada && (
                <span className="text-[7px] text-yellow-500 font-bold uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-1.5 rounded">
                  {medalhaAtiva.progresso}
                </span>
              )}
            </div>
            <p className="text-[9px] text-gray-400 leading-tight">
              {medalhaAtiva.desc}
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            {medalhaAtiva.desbloqueada ? (
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-inner">
                Desbloqueada ✓
              </span>
            ) : (
              <span className="bg-white/5 text-gray-500 border border-white/10 text-[7px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1 rounded-md">
                🔒 Bloqueada
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}