import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

// ROTA GET: Puxa todos os filmes da "pasta" filmes no Firebase
export async function GET() {
  try {
    const filmesRef = collection(db, "filmes"); // Aponta para a coleção "filmes"
    const querySnapshot = await getDocs(filmesRef); // Puxa os documentos
    
    // Organiza os dados para o formato que o nosso site entende
    const filmes = [];
    querySnapshot.forEach((doc) => {
      filmes.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json(filmes, { status: 200 }); // Devolve pro site
  } catch (error) {
    console.log("🚨 ERRO NO GET FIREBASE:", error);
    return NextResponse.json({ erro: "Falha ao buscar filmes" }, { status: 500 });
  }
}

// ROTA POST: Salva um filme novo direto no Firebase
export async function POST(request) {
  try {
    const dadosDoFilme = await request.json(); // Pega o que o usuário digitou
    
    // Prepara os dados iniciais (todo filme começa com 0 votos)
    const filmeParaSalvar = {
      ...dadosDoFilme,
      notaGeral: 0,
      quantidadeVotos: 0,
      dataCriacao: new Date().toISOString()
    };

    const filmesRef = collection(db, "filmes");
    const docRef = await addDoc(filmesRef, filmeParaSalvar); // Salva lá na nuvem!
    
    return NextResponse.json({ id: docRef.id, ...filmeParaSalvar }, { status: 201 });
  } catch (error) {
    console.log("🚨 ERRO NO POST FIREBASE:", error);
    return NextResponse.json({ erro: "Falha ao salvar o filme" }, { status: 500 });
  }
}