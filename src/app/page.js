import Navbar from "../components/Navbar";
import ListaFilmes from "../components/ListaFilmes"; // Importa o novo componente
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

// Funções de apoio (Data e Veredito)
function formatarDataBR(dataISO) {
  if (!dataISO) return null;
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function obterVeredito(notaGeral) {
  if (notaGeral === 0) return { texto: "Sem nota", cor: "text-gray-400 border-gray-600 bg-gray-800" };
  if (notaGeral <= 3) return { texto: "Lixo", cor: "text-red-400 border-red-500/50 bg-red-900/20" };
  if (notaGeral <= 5) return { texto: "Ruim", cor: "text-orange-400 border-orange-500/50 bg-orange-900/20" };
  if (notaGeral <= 7) return { texto: "Legal", cor: "text-yellow-400 border-yellow-500/50 bg-yellow-900/20" };
  if (notaGeral <= 9) return { texto: "Muito Bom", cor: "text-blue-400 border-blue-500/50 bg-blue-900/20" };
  return { texto: "Ótimo", cor: "text-green-400 border-green-500/50 bg-green-900/20" };
}

export default async function Home() {
  let assistidos = [];
  let sugeridos = [];

  try {
    const querySnapshot = await getDocs(collection(db, "filmes"));
    querySnapshot.forEach((doc) => {
      const filme = { id: doc.id, ...doc.data() };
      const info = {
        dataFormatada: formatarDataBR(filme.dataAssistido),
        veredito: obterVeredito(filme.notaGeral || 0)
      };

      if (filme.status === "sugerido") {
        sugeridos.push({ ...filme, ...info });
      } else {
        assistidos.push({ ...filme, ...info });
      }
    });
  } catch (error) { console.error(error); }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-20">
      
      {/* HERO BANNER (Mantém o mesmo código visual anterior) */}
      <div className="relative min-h-[380px] sm:min-h-[500px] w-full flex items-start sm:items-center justify-center overflow-hidden border-b border-white/10 pb-20 sm:pb-0">
  {/* Imagem de Fundo */}
  <div 
    className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-[2px] scale-110"
    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop')` }}
  ></div>
  <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent"></div>
  
  <div className="relative z-20 w-full max-w-6xl px-6 pt-2 sm:pt-10">
    <Navbar />
    
    <div className="mt-4 sm:mt-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-4xl sm:text-7xl font-black tracking-tighter mb-2 sm:mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent leading-none">
          FILMES DA <br className="hidden sm:block"/> GALERA.
        </h2>
        <p className="text-gray-400 max-w-md text-xs sm:text-lg leading-relaxed mx-auto md:mx-0 px-4 sm:px-0">
          Nossa curadoria particular de cinema. Onde a gente decide o que presta e o que vai pro lixo.
        </p>
      </div>

      {/* CONTADORES (Mais compactos no mobile) */}
      <div className="flex justify-center gap-2 sm:gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2 sm:p-4 rounded-2xl w-24 sm:w-32 text-center">
          <span className="block text-xl sm:text-3xl font-black text-red-500">{assistidos.length}</span>
          <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500">Vistos</span>
        </div>
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2 sm:p-4 rounded-2xl w-24 sm:w-32 text-center">
          <span className="block text-xl sm:text-3xl font-black text-blue-500">{sugeridos.length}</span>
          <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-gray-500">Na Fila</span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* CHAMADA DA LISTA COM FILTRO (CLIENT COMPONENT) */}
      <ListaFilmes filmesIniciais={assistidos} />

      {/* SEÇÃO DE SUGESTÕES (Pode continuar aqui na Home) */}
      <div className="max-w-6xl mx-auto px-6 border-t border-white/5 pt-16">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
              Próximas Paradas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sugeridos.map((filme) => (
                <a href={`/filme/${filme.id}`} key={filme.id} className="group bg-[#141414] rounded-2xl flex overflow-hidden border border-white/5 h-36 hover:border-blue-500/50 transition-all">
                  <img src={filme.capa} className="w-24 object-cover group-hover:scale-110 transition-transform duration-500" alt={filme.titulo} />
                  <div className="p-4 flex flex-col justify-between flex-1">
                      <h3 className="font-bold text-sm line-clamp-2">{filme.titulo}</h3>
                      <div className="flex justify-between items-end">
                          {filme.sugeridoPor && (
                              <div className="flex items-center gap-2">
                                  <img src={filme.sugeridoPor.foto} className="w-5 h-5 rounded-full" />
                                  <span className="text-[10px] text-gray-500">{filme.sugeridoPor.nome.split(" ")[0]}</span>
                              </div>
                          )}
                          <span className="bg-blue-900/30 text-blue-400 text-[10px] font-black px-2 py-1 rounded">🔥 {filme.upvotes?.length || 0}</span>
                      </div>
                  </div>
                </a>
            ))}
          </div>
      </div>
    </main>
  );
}