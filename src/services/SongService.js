import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const songCollectionRef = collection(db, "songs");

export const addSong = async (songData) => {
  await addDoc(songCollectionRef, songData);
};

export const fetchSongs = async () => {
  const data = await getDocs(songCollectionRef);
  return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};
