import { NextResponse } from "next/server";

export async function GET(request) {
  // Pega o nome do filme que o usuário digitou na URL
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ erro: "Digite o nome de um filme" }, { status: 400 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  
  // URL oficial do TMDB para buscar filmes em Português do Brasil!
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`;

  try {
    const resposta = await fetch(url);
    const dados = await resposta.json();
    
    // Devolve os resultados pro nosso site
    return NextResponse.json(dados.results, { status: 200 });
  } catch (error) {
    console.log("Erro no TMDB:", error);
    return NextResponse.json({ erro: "Falha ao buscar no TMDB" }, { status: 500 });
  }
}