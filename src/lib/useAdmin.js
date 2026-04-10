import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Esse é o nosso "Olheiro de Admins"
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [carregandoAdmin, setCarregandoAdmin] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se tem alguém logado, vai lá na coleção "admins" procurar o e-mail dele
        const adminDoc = await getDoc(doc(db, "admins", user.email));
        setIsAdmin(adminDoc.exists() && adminDoc.data().ativo === true);
      } else {
        setIsAdmin(false);
      }
      setCarregandoAdmin(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAdmin, carregandoAdmin };
}