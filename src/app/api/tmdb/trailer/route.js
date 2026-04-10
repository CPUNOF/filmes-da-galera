import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id"); // Recebe o ID do filme no TMDB

  const apiKey = process.env.TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}&language=pt-BR`;

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();
    
    // Procuramos um vídeo que seja do YouTube e seja um "Trailer"
    const trailer = dados.results.find(vid => vid.site === "YouTube" && vid.type === "Trailer") 
                   || dados.results[0]; // Se não achar trailer, pega o primeiro vídeo que tiver

    return NextResponse.json({ key: trailer?.key || null });
  } catch (error) {
    return NextResponse.json({ key: null }, { status: 500 });
  }
}