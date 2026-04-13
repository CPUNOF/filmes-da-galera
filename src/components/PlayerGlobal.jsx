"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import PainelKaraoke from "./PainelKaraoke";

// 🪄 COLOQUE A SUA CHAVE DA API DO YOUTUBE AQUI PARA O AUTO-DJ FUNCIONAR
const YOUTUBE_API_KEY = "COLOQUE_AQUI_A_SUA_CHAVE_DO_YOUTUBE"; 

export default function PlayerGlobal({ isOwner, usuarioLogado }) {
  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQueue, setShowQueue] = useState(false); 
  const [isTheater, setIsTheater] = useState(false);
  const [showKaraoke, setShowKaraoke] = useState(false); // ESTADO DO KARAOKÊ
  const [progress, setProgress] = useState(0);
  const [offsetStart, setOffsetStart] = useState(0); 
  
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [isAutoDJ, setIsAutoDJ] = useState(true);
  const [buscandoDJ, setBuscandoDJ] = useState(false);
  
  const iframeRef = useRef(null);
  const videoContainerRef = useRef(null);
  const processingNextRef = useRef(false);

  useEffect(() => {
    const handleGlobalPlay = (e) => {
      const { track: novaTrack, offset = 0, queueContext = [] } = e.detail;
      setTrack(novaTrack);
      setOffsetStart(offset);
      setIsPlaying(true);
      setProgress(offset > 0 ? (offset / 180) * 100 : 0); 
      
      if (queueContext.length > 0) {
        setQueue(queueContext);
        const index = queueContext.findIndex(t => t.id === novaTrack.id || t.titulo === novaTrack.titulo);
        setCurrentIndex(index !== -1 ? index : 0);
      }
    };

    const handleAddQueue = (e) => {
      const { track: novaTrack } = e.detail;
      setQueue(prev => [...prev, novaTrack]);
      toast.success(`"${novaTrack.titulo}" adicionada à fila!`, { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }});
    };

    const handlePlayNext = (e) => {
      const { track: novaTrack } = e.detail;
      setQueue(prev => {
        const novaFila = [...prev];
        novaFila.splice(currentIndex + 1, 0, novaTrack);
        return novaFila;
      });
      toast.success(`"${novaTrack.titulo}" vai tocar a seguir!`, { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }});
    };

    window.addEventListener("playGlobalMusic", handleGlobalPlay);
    window.addEventListener("addGlobalQueue", handleAddQueue);
    window.addEventListener("playGlobalNext", handlePlayNext);
    return () => {
      window.removeEventListener("playGlobalMusic", handleGlobalPlay);
      window.removeEventListener("addGlobalQueue", handleAddQueue);
      window.removeEventListener("playGlobalNext", handlePlayNext);
    };
  }, [currentIndex]);

  useEffect(() => {
    if (isOwner && usuarioLogado && track) {
      const docRef = doc(db, "usuarios", usuarioLogado.email.toLowerCase());
      if (isPlaying) {
        updateDoc(docRef, { sessaoJam: { track: track, startTimestamp: Date.now() - (offsetStart * 1000), isPlaying: true } }).catch(() => {});
      } else {
        updateDoc(docRef, { 'sessaoJam.isPlaying': false }).catch(() => {});
      }
    }
  }, [isPlaying, track, isOwner, usuarioLogado, offsetStart]);

  const sendCommand = (cmd, args = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: args }), '*');
    }
  };

  useEffect(() => {
    if (isPlaying) sendCommand('playVideo');
    else sendCommand('pauseVideo');
  }, [isPlaying]);

  const carregarMusicaInteligente = async (referenciaTrack) => {
    if (!referenciaTrack || !referenciaTrack.artista) return null;
    
    if (YOUTUBE_API_KEY === "COLOQUE_AQUI_A_SUA_CHAVE_DO_YOUTUBE" || YOUTUBE_API_KEY === "") {
      toast.error("Configure a API Key do YouTube no código para o Auto-DJ funcionar!");
      setIsAutoDJ(false); 
      return null;
    }
    
    setBuscandoDJ(true);
    try {
      const queryBusca = `${referenciaTrack.artista} official audio`;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(queryBusca)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        const validos = data.items.filter(item => !queue.some(q => q.audioUrl === item.id.videoId));
        
        if (validos.length > 0) {
          const escolhida = validos[Math.floor(Math.random() * validos.length)];
          const tituloLimpo = escolhida.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
          
          const novaTrack = {
            titulo: tituloLimpo,
            capa: escolhida.snippet.thumbnails.high.url,
            artista: escolhida.snippet.channelTitle,
            audioUrl: escolhida.id.videoId,
            isRecomendada: true 
          };
          
          setQueue(prev => [...prev, novaTrack]);
          setBuscandoDJ(false);
          return novaTrack;
        }
      }
    } catch(e) { console.error("Erro no Auto-DJ", e); }
    setBuscandoDJ(false);
    return null;
  };

  const handleNext = async () => {
    if (processingNextRef.current) return;
    processingNextRef.current = true;

    if (queue.length > 0 && currentIndex < queue.length - 1) {
      setTrack(queue[currentIndex + 1]);
      setCurrentIndex(currentIndex + 1);
      setProgress(0); setOffsetStart(0); setIsPlaying(true);
      processingNextRef.current = false;
    } 
    else if (isAutoDJ && track) {
      toast("O Auto-DJ está a misturar a próxima faixa... 🤖", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #ec4899' }});
      const novaMusica = await carregarMusicaInteligente(track);
      
      if (novaMusica) {
        setTrack(novaMusica);
        setCurrentIndex(prev => prev + 1);
        setProgress(0); setOffsetStart(0); setIsPlaying(true);
      } else {
        setIsPlaying(false); setProgress(0);
      }
      processingNextRef.current = false;
    } else {
      setIsPlaying(false); setProgress(0);
      processingNextRef.current = false;
    }
  };

  const handlePrev = () => {
    if (queue.length > 0 && currentIndex > 0) {
      setTrack(queue[currentIndex - 1]);
      setCurrentIndex(currentIndex - 1);
      setProgress(0); setOffsetStart(0); setIsPlaying(true);
    } else {
      setProgress(0); setOffsetStart(0); sendCommand('seekTo', [0]);
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.playerState === 0 && !processingNextRef.current) {
            handleNext();
          }
        }
      } catch (e) {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentIndex, queue, isAutoDJ, track]);

  const pularParaMusicaFila = (index) => {
    setTrack(queue[index]);
    setCurrentIndex(index);
    setProgress(0); setOffsetStart(0); setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const onIframeLoad = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
    }
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => { setProgress(prev => (prev >= 100 ? 100 : prev + 0.3)); }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const salvarMusicaNoPerfil = async () => {
    if (!usuarioLogado || !track) return;
    
    const t = toast.loading("A verificar a sua Playlist...");
    
    try {
      const q = query(
        collection(db, "perfil_cultura"), 
        where("uid", "==", usuarioLogado.uid), 
        where("tipo", "==", "Música"),
        where("audioUrl", "==", track.audioUrl)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast.dismiss(t);
        toast.error("Essa música já está na sua Playlist! 😉", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #eab308' }});
        return;
      }

      toast.loading("A guardar a descoberta... 🤖", { id: t });

      const payload = { 
        uid: usuarioLogado.uid, 
        tipo: 'Música', 
        titulo: track.titulo, 
        capa: track.capa, 
        artista: track.artista, 
        audioUrl: track.audioUrl,
        sinopse: track.isRecomendada ? "Descoberta pelo Auto-DJ 🤖" : "",
        temporada: 1, progresso: 0, total: 1, tier: "Nenhum",
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      await addDoc(collection(db, "perfil_cultura"), payload);
      
      setTrack(prev => ({ ...prev, isRecomendada: false }));
      
      toast.dismiss(t);
      toast.success("Música guardada com sucesso! 💖", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #22c55e' }});
      
    } catch (error) { 
      console.error(error);
      toast.dismiss(t); toast.error("Erro ao guardar."); 
    }
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9999999] animate-fade-in-up">
      
      {/* PAINEL DA FILA (QUEUE) */}
      {showQueue && (
        <div className="absolute bottom-full right-4 sm:right-24 mb-4 w-[300px] sm:w-[350px] bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[450px] animate-fade-in-up">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/50">
            <div className="flex flex-col">
              <h3 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8"/></svg> 
                Fila de Reprodução
              </h3>
            </div>
            <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded-full bg-white/5">✕</button>
          </div>
          
          <div className="px-4 py-3 bg-black/30 border-b border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Quando a fila acabar, tocamos<br/>músicas parecidas para si.</span>
            <button onClick={() => setIsAutoDJ(!isAutoDJ)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all border shrink-0 ${isAutoDJ ? 'bg-pink-600/20 text-pink-400 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'bg-white/5 text-gray-500 border-white/10'}`}>
              🤖 Auto-DJ: {isAutoDJ ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {queue.slice(currentIndex + 1).length === 0 && !buscandoDJ && (
              <p className="text-center text-gray-500 text-[10px] uppercase font-black py-10">{isAutoDJ ? "A IA vai escolher a próxima música..." : "Fila vazia."}</p>
            )}
            {buscandoDJ && (
              <div className="flex items-center justify-center gap-2 py-6 text-pink-500 animate-pulse">
                <span className="text-[10px] font-black uppercase tracking-widest">O DJ está a misturar...</span>
              </div>
            )}
            {queue.map((t, i) => {
              if (i <= currentIndex) return null;
              return (
                <div key={i} onClick={() => pularParaMusicaFila(i)} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group">
                  <span className="text-gray-600 text-[9px] font-black w-4 text-center group-hover:text-pink-500 transition-colors">▶</span>
                  <img src={t.capa} className="w-10 h-10 rounded-md object-cover border border-white/10" alt="" />
                  <div className="flex flex-col truncate flex-1">
                    <span className="text-xs font-black text-white uppercase truncate group-hover:text-pink-400 transition-colors">{t.titulo}</span>
                    <span className="text-[9px] text-gray-500 uppercase font-bold truncate">{t.artista}</span>
                  </div>
                  {t.isRecomendada && <span className="text-[8px] bg-pink-600/20 text-pink-500 px-1.5 rounded border border-pink-500/30 font-black">IA</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODO VÍDEO E TEATRO */}
      <div ref={videoContainerRef} className={`absolute transition-all duration-500 transform group ${showVideo && !showQueue ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-50 bottom-full right-4 mb-4'} ${isTheater ? 'bottom-24 left-1/2 -translate-x-1/2 w-[95vw] md:w-[70vw] max-w-[900px] aspect-video' : 'bottom-full right-4 mb-4 w-[280px] sm:w-[400px] aspect-video'}`}>
        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full h-full group-hover:border-pink-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-full p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-end gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsTheater(!isTheater)} className="w-8 h-8 bg-black/50 hover:bg-pink-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all" title="Modo Teatro"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v10H5V7z"/></svg></button>
            <button onClick={toggleFullscreen} className="w-8 h-8 bg-black/50 hover:bg-pink-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all" title="Tela Cheia"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
          </div>
          <iframe ref={iframeRef} onLoad={onIframeLoad} src={`https://www.youtube.com/embed/${track.audioUrl}?enablejsapi=1&autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&start=${Math.floor(offsetStart)}`} className="w-full h-full pointer-events-none" allow="autoplay; fullscreen" />
          <div className="absolute inset-0 z-10 pointer-events-auto" onDoubleClick={toggleFullscreen}></div> 
        </div>
      </div>

      {/* BARRA DO PLAYER PRINCIPAL TOTALMENTE ALINHADA */}
      <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/5 px-4 py-3 sm:py-4 flex items-center justify-between gap-4 relative z-50">
        
        {/* LADO ESQUERDO: INFO DA MÚSICA & BOTÃO GUARDAR */}
        <div className="flex items-center w-1/3 min-w-0">
          <img src={track.capa} className={`w-10 h-10 sm:w-14 sm:h-14 rounded-md sm:rounded-lg shadow-lg object-cover border border-white/10 ${isPlaying ? 'animate-pulse' : ''} shrink-0`} alt="" />
          <div className="flex flex-col truncate ml-3">
            <span className="text-white font-black text-[10px] sm:text-sm uppercase tracking-widest truncate drop-shadow-md flex items-center gap-2">
              {track.titulo} 
              {track.isRecomendada && <span className="text-[7px] bg-pink-600/20 text-pink-500 px-1 rounded border border-pink-500/30 hidden sm:inline-block">IA</span>}
            </span>
            <span className="text-pink-500 font-bold text-[8px] sm:text-[10px] uppercase truncate">{track.artista}</span>
          </div>
          {isOwner && track.isRecomendada && (
            <button 
              onClick={salvarMusicaNoPerfil} 
              className="ml-3 w-8 h-8 rounded-full hidden sm:flex items-center justify-center shrink-0 text-gray-500 hover:text-pink-500 hover:bg-pink-500/10 transition-all border border-transparent hover:border-pink-500/30" 
              title="Guardar na minha Playlist"
            >
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
          )}
        </div>

        {/* CENTRO: CONTROLOS DE MEDIA */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
          <div className="flex items-center gap-4 sm:gap-6 mb-1 sm:mb-2">
             <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
               <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
             </button>
             <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 sm:w-12 sm:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
               {isPlaying ? (
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 sm:w-6 sm:h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 sm:w-6 sm:h-6 ml-0.5 sm:ml-1"><path d="M8 5v14l11-7z"/></svg>
               )}
             </button>
             <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors relative">
               <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
             </button>
          </div>
          <div className="w-full flex items-center gap-2">
            <span className="text-[7px] sm:text-[8px] font-mono text-gray-500">LIVE</span>
            <div className="flex-1 h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
              <div className="h-full bg-pink-600 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            {isOwner && <span className="text-[7px] sm:text-[8px] font-black uppercase text-pink-500 animate-pulse hidden sm:inline">ON AIR</span>}
          </div>
        </div>

        {/* LADO DIREITO: OPÇÕES EXTRAS (KARAOKE, FILA, VÍDEO) */}
        <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/3">
          
          <button onClick={() => { setShowKaraoke(!showKaraoke); setShowQueue(false); setShowVideo(false); setIsTheater(false); }} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${showKaraoke ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Letras e Significado">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </button>

          <button onClick={() => { setShowQueue(!showQueue); setShowVideo(false); setIsTheater(false); setShowKaraoke(false); }} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${showQueue ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Fila">
             <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8"/></svg>
          </button>
          
          <button onClick={() => { setShowVideo(!showVideo); setShowQueue(false); setShowKaraoke(false); }} className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${showVideo ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`} title="Vídeo">
             <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </button>
          
        </div>

      </div>

      {/* RENDERIZAR O PAINEL DE KARAOKÊ */}
      {showKaraoke && (
        <PainelKaraoke 
          track={track} 
          isOwner={isOwner} 
          onClose={() => setShowKaraoke(false)} 
        />
      )}
    </div>
  );
}