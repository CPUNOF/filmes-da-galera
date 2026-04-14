"use client";

import React from "react";

// 🪄 ÍCONES SVG PROFISSIONAIS (SEM EMOJIS)
const Icones = {
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  Fire: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>,
  Scissors: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.338 14.338l-4.676-4.676m0 0L7.437 7.437m2.225 2.225l4.676 4.676m-4.676-4.676a2.25 2.25 0 11-3.182-3.182 2.25 2.25 0 013.182 3.182zm4.676 4.676a2.25 2.25 0 11-3.182-3.182 2.25 2.25 0 013.182 3.182zm-4.676-4.676L16.563 16.563" /></svg>,
  Poison: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>,
  Crown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  Diamond: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
  Star: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>,
  Medal: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 4.972" /></svg>
};

export default function CartazCompartilhamento({ tipo = "lixao", obra, responsavel }) {
  // Configurações Dinâmicas (Lixão vs Olimpo)
  const isLixo = tipo === "lixao";
  
  const tema = {
    bgPrincipal: isLixo ? "bg-[#050505]" : "bg-[#020617]",
    bgSecundario: isLixo ? "bg-[#0a0a0a]" : "bg-[#0f172a]",
    badgeIcon: isLixo ? <Icones.Trash /> : <Icones.Crown />,
    badgeTitle: isLixo ? "HALL DA VERGONHA" : "HALL DA FAMA",
    badgeColor: isLixo ? "text-green-500 border-green-900 bg-green-950/30" : "text-amber-400 border-amber-700 bg-amber-900/30",
    mainTitle1: isLixo ? "O LIXÃO DA " : "O OLIMPO DA ",
    mainTitle2: isLixo ? "GALERA" : "GALERA",
    title2Color: isLixo ? "text-green-500 line-through decoration-red-600 decoration-4" : "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]",
    subtitle: isLixo 
      ? "Estes são os piores títulos do nosso acervo. Sinta-se livre para fatiar, atirar, queimar e destruir este poster." 
      : "As obras-primas absolutas do nosso acervo. Contemple a perfeição cinematográfica esculpida pelos deuses.",
    posterBorder: isLixo ? "border-red-900/50 shadow-[0_0_60px_rgba(220,38,38,0.15)]" : "border-amber-500/50 shadow-[0_0_60px_rgba(251,191,36,0.2)]",
    sidePanelTitle: isLixo ? "ARSENAL" : "HONRARIAS",
    sideIcons: isLixo ? [Icones.Poison, Icones.Trash, Icones.Scissors, Icones.Fire] : [Icones.Crown, Icones.Diamond, Icones.Medal, Icones.Star],
    iconColor: isLixo ? "text-red-500 group-hover:text-red-400" : "text-amber-400 group-hover:text-amber-300",
    iconBgHover: isLixo ? "hover:border-red-500/50 hover:bg-red-500/10" : "hover:border-amber-400/50 hover:bg-amber-400/10",
    notaBg: isLixo ? "bg-red-600" : "bg-amber-500",
    seloIcon: isLixo ? <Icones.Poison /> : <Icones.Diamond />,
    seloText: isLixo ? "SELO DE CHORUME" : "SELO OBRA-PRIMA",
    seloColor: isLixo ? "text-green-600 border-green-900/50 bg-green-950/20" : "text-blue-400 border-blue-900/50 bg-blue-950/20",
    culpadoBorder: isLixo ? "border-red-900/50 bg-[#110000]" : "border-amber-900/50 bg-[#1a1300]",
    culpadoTitle: isLixo ? "PARABÉNS AO ENVOLVIDO" : "BÊNÇÃO CONCEDIDA POR",
    culpadoTitleColor: isLixo ? "text-red-600" : "text-amber-500",
    culpadoFrase: isLixo 
      ? <>Fez a galera perder <strong className="text-red-500">{obra?.duracao || 0} minutos</strong> de vida.</> 
      : <>Enriqueceu a vida da galera com <strong className="text-amber-500">{obra?.duracao || 0} minutos</strong> de arte.</>,
  };

  return (
    // Container Principal (Proporção ideal para Print/Stories)
    <div className={`w-[600px] min-h-[900px] ${tema.bgPrincipal} flex flex-col items-center pt-12 pb-10 px-10 relative overflow-hidden font-sans border border-white/5 mx-auto rounded-3xl shadow-2xl`}>
      
      {/* Background Glow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none ${isLixo ? 'bg-red-600' : 'bg-amber-500'}`}></div>

      {/* Header Badge */}
      <div className={`border ${tema.badgeColor} rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-6 z-10`}>
        {tema.badgeIcon} {tema.badgeTitle}
      </div>

      {/* Títulos Gigantes */}
      <div className="text-center z-10 mb-8">
        <h1 className="text-[3rem] font-black italic tracking-tighter text-white leading-none drop-shadow-md">
          {tema.mainTitle1}
          <span className={tema.title2Color}>{tema.mainTitle2}</span>
        </h1>
        <p className="text-gray-400 text-xs mt-4 max-w-[400px] mx-auto leading-relaxed opacity-80">
          {tema.subtitle}
        </p>
      </div>

      {/* Centro: Poster e Painel Lateral */}
      <div className="flex items-center gap-8 z-10 w-full justify-center">
        
        {/* Poster do Filme */}
        <div className="relative">
          <img 
            src={obra?.capa || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564"} 
            className={`w-[280px] h-[420px] object-cover rounded-2xl border-[6px] ${tema.posterBorder}`} 
            alt="Capa" 
          />
        </div>

        {/* Painel Lateral (Arsenal ou Honrarias) */}
        <div className={`w-20 ${tema.bgSecundario} border border-white/5 rounded-[2rem] py-6 flex flex-col items-center gap-4 shadow-xl`}>
          <span className="text-[8px] font-black tracking-widest text-gray-500 uppercase mb-2">{tema.sidePanelTitle}</span>
          
          {tema.sideIcons.map((Icon, idx) => (
            <div key={idx} className={`w-12 h-12 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-center cursor-default transition-all group ${tema.iconBgHover}`}>
              <div className={`opacity-50 group-hover:opacity-100 transition-opacity ${tema.iconColor}`}>
                <Icon />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Título do Filme e Badges */}
      <div className="text-center z-10 mt-8 w-full">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4 px-4 drop-shadow-lg">
          {obra?.titulo || "Obra Desconhecida"}
        </h2>
        
        <div className="flex items-center justify-center gap-3">
          <div className={`${tema.notaBg} text-white font-black uppercase text-xs px-4 py-1.5 rounded-lg tracking-widest shadow-md`}>
            NOTA: {obra?.nota || "0.0"}
          </div>
          <div className={`border flex items-center gap-2 font-black uppercase text-[10px] px-4 py-1.5 rounded-lg tracking-widest ${tema.seloColor}`}>
            <span className="w-3 h-3">{tema.seloIcon}</span> {tema.seloText}
          </div>
        </div>
      </div>

      {/* Caixa do Envolvido / Culpado */}
      <div className={`mt-auto mb-2 w-full max-w-[450px] border rounded-[2rem] p-5 flex items-center gap-5 z-10 shadow-2xl relative overflow-hidden ${tema.culpadoBorder}`}>
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 pointer-events-none ${isLixo ? 'bg-red-500' : 'bg-amber-500'}`}></div>

        <div className="relative shrink-0">
          <img 
            src={responsavel?.foto || "https://api.dicebear.com/7.x/initials/svg?seed=U"} 
            className={`w-16 h-16 rounded-full object-cover border-2 shadow-lg ${isLixo ? 'border-red-900' : 'border-amber-500'}`} 
            alt="Foto" 
          />
          <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#110000] shadow-md ${isLixo ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'}`}>
            {isLixo ? <Icones.Trash /> : <Icones.Crown />}
          </div>
        </div>

        <div className="flex flex-col relative z-10">
          <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${tema.culpadoTitleColor}`}>
            {tema.culpadoTitle}
          </span>
          <span className="text-xl font-black text-white uppercase italic tracking-wide leading-none mb-1 drop-shadow-md">
            {responsavel?.nome || "Membro Oculto"}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {tema.culpadoFrase}
          </span>
        </div>
      </div>

    </div>
  );
}