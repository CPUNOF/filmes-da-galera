import Navbar from "@/components/Navbar";

export default function LoadingHome() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-20 overflow-x-hidden">
      
      {/* 🎬 ESQUELETO DO HERO (CABEÇALHO) */}
      <div className="relative w-full h-[55vh] sm:h-[70vh] flex items-center justify-center border-b border-white/5 bg-[#101010]">
        <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 h-full flex flex-col pt-6 sm:pt-10">
          <Navbar />
          
          <div className="mt-8 sm:mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="w-full md:w-1/2 space-y-4 animate-pulse">
              {/* Título Fantasma */}
              <div className="h-16 sm:h-24 bg-white/5 rounded-2xl w-3/4"></div>
              {/* Subtítulo Fantasma */}
              <div className="h-4 sm:h-6 bg-white/5 rounded-full w-full"></div>
              <div className="h-4 sm:h-6 bg-white/5 rounded-full w-2/3"></div>
            </div>

            {/* Contadores Fantasmas */}
            <div className="flex justify-center gap-2 sm:gap-4 animate-pulse">
              <div className="bg-white/5 p-2 sm:p-4 rounded-2xl w-24 sm:w-32 h-20 sm:h-28"></div>
              <div className="bg-white/5 p-2 sm:p-4 rounded-2xl w-24 sm:w-32 h-20 sm:h-28"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 📝 ESQUELETO DA LISTA DE FILMES */}
      <div className="max-w-[1400px] mx-auto px-6 -mt-16 relative z-30">
        
        {/* Barra de Filtro Fantasma */}
        <div className="h-14 bg-[#141414] rounded-full border border-white/5 mb-10 w-full animate-pulse shadow-2xl"></div>

        {/* Grid de Cards Fantasmas */}
        <div className="mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            
            {/* Gerando 10 cards falsos para preencher a tela */}
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-[#141414] rounded-xl overflow-hidden shadow-lg border border-white/5 flex flex-col h-64 sm:h-80 animate-pulse">
                {/* Capa do Filme */}
                <div className="h-3/4 w-full bg-white/5"></div>
                {/* Textos do Card */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="h-4 bg-white/10 rounded-md w-full"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-white/10 rounded-md w-1/3"></div>
                    <div className="h-4 bg-white/10 rounded-md w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
      
    </main>
  );
}