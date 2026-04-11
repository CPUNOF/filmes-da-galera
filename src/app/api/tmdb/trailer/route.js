import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Recebe o ID do filme no TMDB

  const apiKey = process.env.TMDB_API_KEY;
  const urlPT = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=pt-BR`;
  const urlEN = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=en-US`;

  try {
    // 1. Tenta buscar o trailer em Português (Brasil)
    let resposta = await fetch(urlPT);
    let dados = await resposta.json();
    let videos = dados.results || [];

    // 2. Se não achar nada em PT-BR, busca o acervo em Inglês (Salva os filmes antigos!)
    if (videos.length === 0) {
      resposta = await fetch(urlEN);
      dados = await resposta.json();
      videos = dados.results || [];
    }

    // 3. Garante que só vamos pegar vídeos hospedados no YouTube (Evita player quebrado)
    const videosYouTube = videos.filter(vid => vid.site === "YouTube");

    if (videosYouTube.length === 0) {
      return NextResponse.json({ key: null });
    }

    // 4. Lógica de prioridade: Tenta achar o Trailer Oficial perfeito.
    const trailerOficial = videosYouTube.find(vid => vid.type === "Trailer" && vid.official);
    const trailerComum = videosYouTube.find(vid => vid.type === "Trailer");
    const teaserOficial = videosYouTube.find(vid => vid.type === "Teaser" && vid.official);
    const clipOuQualquerCoisa = videosYouTube[0];
    
    const videoEscolhido = trailerOficial || trailerComum || teaserOficial || clipOuQualquerCoisa;

    return NextResponse.json({ key: videoEscolhido.key });
  } catch (error) {
    return NextResponse.json({ key: null }, { status: 500 });
  }
}