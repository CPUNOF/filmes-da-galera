"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import PainelKaraoke from "./PainelKaraoke";

// 🪄 SUA CHAVE AQUI
const YOUTUBE_API_KEY = "AIzaSyDq8o6rJNZpvyNWyA1wZqv3j09X9f4zPIw"; 

export default function PlayerGlobal() {
  const pathname = usePathname();
  
  const [mounted, setMounted] = useState(false);
  const [isClone, setIsClone] = useState(false);

  useEffect(() => {
    if (window.fdgPlayerAtivo) {
      setIsClone(true);
      return;
    }
    window.fdgPlayerAtivo = true;
    setMounted(true);
    return () => { window.fdgPlayerAtivo = false; };
  }, []);

  const [usuarioLogado, setUsuarioLogado] = useState(null);
  
  // Usado apenas para permissões de edição se necessário (mas o Jam agora é global!)
  const isOwner = usuarioLogado && pathname.includes(usuarioLogado?.uid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUsuarioLogado(user));
    return () => unsub();
  }, []);

  const [track, setTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQueue, setShowQueue] = useState(false); 
  const [isTheater, setIsTheater] = useState(false);
  const [showKaraoke, setShowKaraoke] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(210); 
  const [volume, setVolume] = useState(100); 
  const [offsetStart, setOffsetStart] = useState(0); 
  
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const [isAutoDJ, setIsAutoDJ] = useState(true);
  const [buscandoDJ, setBuscandoDJ] = useState(false);
  
  // 🪄 NOVO: ESTADO PARA SABER SE A MÚSICA JÁ ESTÁ NA PLAYLIST GLOBAL DO UTILIZADOR
  const [isSaved, setIsSaved] = useState(false);

  const [iframeSrc, setIframeSrc] = useState("");
  const ultimaUrlCarregada = useRef("");

  const iframeRef = useRef(null);
  const videoContainerRef = useRef(null);
  const processingNextRef = useRef(false);

  const queueRef = useRef([]);
  const currentIndexRef = useRef(-1);
  const isAutoDJRef = useRef(true);
  const trackRef = useRef(null);
  const isPlayingRef = useRef(false); 

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isAutoDJRef.current = isAutoDJ; }, [isAutoDJ]);
  useEffect(() => { trackRef.current = track; }, [track]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  const fecharPlayer = () => {
    setIsPlaying(false);
    setTrack(null);
    setShowVideo(false);
    setShowQueue(false);
    setShowKaraoke(false);
    setProgress(0);
    setIframeSrc(""); 
    ultimaUrlCarregada.current = "";
  };

  useEffect(() => {
    if (!isPlayingRef.current && trackRef.current) {
      fecharPlayer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 🪄 VERIFICAÇÃO INTELIGENTE DE DUPLICATAS EM TEMPO REAL
  useEffect(() => {
    if (!usuarioLogado || !track) return;
    
    const verificarSeJaExiste = async () => {
      try {
        const q = query(
          collection(db, "perfil_cultura"), 
          where("uid", "==", usuarioLogado.uid), 
          where("tipo", "==", "Música"), 
          where("audioUrl", "==", track.audioUrl)
        );
        const snap = await getDocs(q);
        setIsSaved(!snap.empty); // Se não estiver vazio, significa que já tem!
      } catch (error) {
        console.error("Erro ao verificar playlist:", error);
      }
    };
    
    verificarSeJaExiste();
  }, [track, usuarioLogado]);

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
        novaFila.splice(currentIndexRef.current + 1, 0, novaTrack);
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
  }, []);

  // 🪄 JAM CONSERTADO: Agora transmite para o Feed de QUALQUER PÁGINA (sem precisar do isOwner)
  useEffect(() => {
    if (usuarioLogado && track) {
      const docRef = doc(db, "usuarios", usuarioLogado.email.toLowerCase());
      if (isPlaying) {
        updateDoc(docRef, { sessaoJam: { track: track, startTimestamp: Date.now() - (offsetStart * 1000), isPlaying: true } }).catch(() => {});
      } else {
        updateDoc(docRef, { 'sessaoJam.isPlaying': false }).catch(() => {});
      }
    }
  }, [isPlaying, track, usuarioLogado, offsetStart]);

  const sendCommand = (cmd, args = []) => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: args }), '*');
    }
  };

  useEffect(() => {
    if (!track) return;
    
    if (!iframeSrc) {
      setIframeSrc(`https://www.youtube.com/embed/${track.audioUrl}?enablejsapi=1&autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&start=${Math.floor(offsetStart)}`);
      ultimaUrlCarregada.current = track.audioUrl;
    } 
    else if (ultimaUrlCarregada.current !== track.audioUrl) {
      ultimaUrlCarregada.current = track.audioUrl;
      sendCommand('loadVideoById', [track.audioUrl, Math.floor(offsetStart)]);
      
      setTimeout(() => {
        sendCommand('playVideo');
        sendCommand('unMute');
      }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  useEffect(() => {
    if (isPlaying) {
      sendCommand('playVideo');
      sendCommand('unMute'); 
      sendCommand('setVolume', [volume]);
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying, volume]);

  const handleVolumeChange = (e) => {
    const vol = e.target.value;
    setVolume(vol);
    sendCommand('setVolume', [vol]);
    if (vol > 0) sendCommand('unMute');
  };

  const handleSeek = (e) => {
    const barra = e.currentTarget;
    const clickX = e.clientX - barra.getBoundingClientRect().left;
    const percent = clickX / barra.offsetWidth;
    setProgress(percent * 100);
    
    const tempoAlvo = percent * duration;
    sendCommand('seekTo', [tempoAlvo, true]);
  };

  const carregarMusicaInteligente = async (referenciaTrack) => {
    if (!referenciaTrack || !referenciaTrack.artista) return null;
    if (YOUTUBE_API_KEY === "COLOQUE_AQUI_A_SUA_CHAVE_DO_YOUTUBE" || YOUTUBE_API_KEY === "") {
      setIsAutoDJ(false); return null;
    }
    setBuscandoDJ(true);
    try {
      const queryBusca = `${referenciaTrack.artista} official audio`;
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(queryBusca)}&type=video&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const validos = data.items.filter(item => !queueRef.current.some(q => q.audioUrl === item.id.videoId));
        if (validos.length > 0) {
          const escolhida = validos[Math.floor(Math.random() * validos.length)];
          const tituloLimpo = escolhida.snippet.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
          const novaTrack = { titulo: tituloLimpo, capa: escolhida.snippet.thumbnails.high.url, artista: escolhida.snippet.channelTitle, audioUrl: escolhida.id.videoId, isRecomendada: true };
          setQueue(prev => [...prev, novaTrack]); setBuscandoDJ(false); return novaTrack;
        }
      }
    } catch(e) {}
    setBuscandoDJ(false); return null;
  };

  const handleNext = async () => {
    if (processingNextRef.current) return;
    processingNextRef.current = true;

    const atualQueue = queueRef.current;
    const atualIndex = currentIndexRef.current;

    if (atualQueue.length > 0 && atualIndex < atualQueue.length - 1) {
      setTrack(atualQueue[atualIndex + 1]); 
      setCurrentIndex(atualIndex + 1);
      setProgress(0); setOffsetStart(0); setIsPlaying(true); processingNextRef.current = false;
    } else if (isAutoDJRef.current && trackRef.current) {
      toast("O Auto-DJ está a misturar a próxima faixa... 🤖", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #ec4899' }});
      const novaMusica = await carregarMusicaInteligente(trackRef.current);
      if (novaMusica) {
        setTrack(novaMusica); setCurrentIndex(prev => prev + 1);
        setProgress(0); setOffsetStart(0); setIsPlaying(true);
      } else { setIsPlaying(false); setProgress(0); }
      processingNextRef.current = false;
    } else {
      setIsPlaying(false); setProgress(0); processingNextRef.current = false;
    }
  };

  const handlePrev = () => {
    if (queue.length > 0 && currentIndex > 0) {
      setTrack(queue[currentIndex - 1]); setCurrentIndex(currentIndex - 1);
      setProgress(0); setOffsetStart(0); setIsPlaying(true);
    } else { setProgress(0); setOffsetStart(0); sendCommand('seekTo', [0]); }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'infoDelivery' && data.info) {
          if (data.info.playerState === 0 && !processingNextRef.current) handleNext();
          if (data.info.duration) setDuration(data.info.duration);
        }
      } catch (e) {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const pularParaMusicaFila = (index) => {
    setTrack(queue[index]); setCurrentIndex(index);
    setProgress(0); setOffsetStart(0); setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) videoContainerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const onIframeLoad = () => {
    if (iframeRef.current) iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
  };

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => { 
        setProgress(prev => {
          const step = (1 / duration) * 100;
          return prev >= 100 ? 100 : prev + step; 
        }); 
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // 🪄 BOTÃO DE LIKE E SALVAR REFORMULADO
  const salvarMusicaNoPerfil = async () => {
    if (!usuarioLogado || !track) return;
    
    // Proteção redundante
    if (isSaved) {
      toast.error("Esta música já está na sua Playlist! 😉", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #eab308' }});
      return;
    }

    const t = toast.loading("A guardar na Playlist Global... 🎶");
    try {
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
      setIsSaved(true); // O Coração fica logo preenchido e rosa!
      
      toast.dismiss(t); 
      toast.success("Música guardada com sucesso! 💖", { style: { background: '#111', color: '#fff', fontSize: '12px', border: '1px solid #22c55e' }});
    } catch (error) { 
      toast.dismiss(t); 
      toast.error("Erro ao guardar."); 
    }
  };

  if (isClone || !mounted || !track) return null;

  return (
    <div id="fdg-player-mestre" className="fixed bottom-0 left-0 w-full z-[9999999] animate-fade-in-up">
      
      {/* FILA */}
      {showQueue && (
        <div className="absolute bottom-full right-4 sm:right-24 mb-4 w-[300px] sm:w-[350px] bg-[#111111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[450px] animate-fade-in-up">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/50">
            <h3 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-2"><svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8"/></svg> Fila</h3>
            <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-white w-6 h-6 flex items-center justify-center rounded-full bg-white/5">✕</button>
          </div>
          <div className="px-4 py-3 bg-black/30 border-b border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Quando a fila acabar, tocamos<br/>músicas parecidas para si.</span>
            <button onClick={() => setIsAutoDJ(!isAutoDJ)} className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all border shrink-0 ${isAutoDJ ? 'bg-pink-600/20 text-pink-400 border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'bg-white/5 text-gray-500 border-white/10'}`}>🤖 Auto-DJ: {isAutoDJ ? 'ON' : 'OFF'}</button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODO VÍDEO COM URL ESTÁVEL */}
      <div ref={videoContainerRef} className={`absolute transition-all duration-500 transform group ${showVideo && !showQueue ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-50 bottom-full right-4 mb-4'} ${isTheater ? 'bottom-24 left-1/2 -translate-x-1/2 w-[95vw] md:w-[70vw] max-w-[900px] aspect-video' : 'bottom-full right-4 mb-4 w-[280px] sm:w-[400px] aspect-video'}`}>
        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] w-full h-full group-hover:border-pink-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-full p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-end gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsTheater(!isTheater)} className="w-8 h-8 bg-black/50 hover:bg-pink-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all" title="Modo Teatro"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 7h14v10H5V7z"/></svg></button>
            <button onClick={toggleFullscreen} className="w-8 h-8 bg-black/50 hover:bg-pink-600 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all" title="Tela Cheia"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg></button>
          </div>
          {iframeSrc && (
            <iframe 
              ref={iframeRef} onLoad={onIframeLoad} 
              src={iframeSrc} 
              className="w-full h-full pointer-events-none" 
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
            />
          )}
          <div className="absolute inset-0 z-10 pointer-events-auto" onDoubleClick={toggleFullscreen}></div> 
        </div>
      </div>

      <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/5 px-4 py-4 sm:py-4 flex items-center justify-between gap-4 relative z-50">
        
        {/* LADO ESQUERDO DA BARRA */}
        <div className="flex items-center w-1/4 sm:w-1/3 min-w-0">
          <img src={track.capa} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg shadow-lg object-cover border border-white/10 ${isPlaying ? 'animate-pulse' : ''} shrink-0`} alt="" />
          <div className="flex flex-col truncate ml-3">
            <span className="text-white font-black text-xs sm:text-sm uppercase tracking-widest truncate drop-shadow-md flex items-center gap-2">
              {track.titulo} 
              {track.isRecomendada && <span className="text-[7px] bg-pink-600/20 text-pink-500 px-1 rounded border border-pink-500/30 hidden sm:inline-block">IA</span>}
            </span>
            <span className="text-pink-500 font-bold text-[9px] sm:text-[10px] uppercase truncate">{track.artista}</span>
          </div>
          
          {/* 🪄 O BOTÃO DE LIKE CORAÇÃO ETERNO E FUNCIONAL */}
          {usuarioLogado && (
            <button 
              onClick={salvarMusicaNoPerfil} 
              className={`ml-3 sm:ml-4 w-9 h-9 rounded-full hidden sm:flex items-center justify-center shrink-0 transition-all border border-transparent ${isSaved ? 'text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-gray-500 hover:text-pink-500 hover:bg-pink-500/10 hover:border-pink-500/30'}`}
              title={isSaved ? "Música já salva na Playlist" : "Adicionar à Playlist Global"}
            >
              <svg fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          )}
        </div>

        {/* CENTRO DA BARRA */}
        <div className="flex flex-col items-center flex-1 max-w-xl">
          <div className="flex items-center gap-5 sm:gap-6 mb-1.5 sm:mb-2">
             <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors p-2">
               <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 sm:w-5 sm:h-5"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
             </button>
             <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 sm:w-12 sm:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
               {isPlaying ? (
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
               ) : (
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 ml-1"><path d="M8 5v14l11-7z"/></svg>
               )}
             </button>
             <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors p-2">
               <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 sm:w-5 sm:h-5"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
             </button>
          </div>
          
          <div className="w-full flex items-center gap-2">
            <span className="text-[8px] font-mono text-gray-500">LIVE</span>
            <div onClick={handleSeek} className="flex-1 h-2 sm:h-1.5 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer">
              <div className="h-full bg-pink-600 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            {/* O ON AIR agora indica que o Jam está a ser transmitido globalmente */}
            {usuarioLogado && <span className="text-[7px] sm:text-[8px] font-black uppercase text-pink-500 animate-pulse hidden sm:inline">ON AIR</span>}
          </div>
        </div>

        {/* LADO DIREITO DA BARRA */}
        <div className="flex items-center justify-end gap-3 sm:gap-4 w-1/4 sm:w-1/3">
          
          <div className="hidden md:flex items-center gap-2 w-24 mr-2 group">
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-600" />
          </div>

          <button onClick={() => { setShowKaraoke(!showKaraoke); setShowQueue(false); setShowVideo(false); setIsTheater(false); }} className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all ${showKaraoke ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
          </button>
          <button onClick={() => { setShowQueue(!showQueue); setShowVideo(false); setIsTheater(false); setShowKaraoke(false); }} className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all ${showQueue ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
             <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8"/></svg>
          </button>
          <button onClick={() => { setShowVideo(!showVideo); setShowQueue(false); setShowKaraoke(false); }} className={`flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-full transition-all ${showVideo ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
             <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 sm:w-4 sm:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </button>
          
          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
          <button onClick={fecharPlayer} className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all" title="Fechar Player">
             <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      {showKaraoke && <PainelKaraoke track={track} isOwner={isOwner} onClose={() => setShowKaraoke(false)} />}
    </div>
  );
}