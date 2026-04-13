"use client";

import { useState, useRef, useEffect } from "react";

export default function CustomAudioPlayer({ src, cor }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pausa qualquer outro áudio que esteja a tocar no site
      document.querySelectorAll('audio').forEach(el => {
        if(el !== audioRef.current) el.pause();
      });
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    
    const setPlay = () => setIsPlaying(true);
    const setPause = () => setIsPlaying(false);
    const setTime = () => setProgress(audioEl.currentTime);
    const setMeta = () => setDuration(audioEl.duration || 30);

    audioEl.addEventListener('play', setPlay);
    audioEl.addEventListener('pause', setPause);
    audioEl.addEventListener('timeupdate', setTime);
    audioEl.addEventListener('loadedmetadata', setMeta);
    
    return () => {
      audioEl.removeEventListener('play', setPlay);
      audioEl.removeEventListener('pause', setPause);
      audioEl.removeEventListener('timeupdate', setTime);
      audioEl.removeEventListener('loadedmetadata', setMeta);
    }
  }, []);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-[#e5e7eb] hover:bg-[#d1d5db] transition-colors text-black px-3 sm:px-4 py-2 rounded-full w-[150px] sm:w-[220px] shadow-inner shrink-0 cursor-pointer" onClick={togglePlay}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Botão de Play/Pause */}
      <button className="shrink-0 flex items-center justify-center w-5 h-5 hover:scale-110 transition-transform">
        {isPlaying ? (
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      {/* Controlos e Tempo */}
      <div className="flex items-center justify-between flex-1 gap-2">
        <span className="text-[9px] sm:text-[10px] font-black font-mono tracking-tighter whitespace-nowrap mt-0.5">
          {formatTime(progress)} / {formatTime(duration)}
        </span>
        
        {/* Mini Barra de Progresso (Visível apenas em ecrãs maiores) */}
        <div className="hidden sm:block flex-1 h-1 bg-gray-400 rounded-full overflow-hidden">
           <div className="h-full bg-black transition-all" style={{ width: `${(progress / (duration||30))*100}%`}}></div>
        </div>

        {/* Ícone de Volume */}
        <svg className="w-3 h-3 shrink-0 text-black hidden sm:block" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </div>
    </div>
  );
}