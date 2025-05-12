import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

const eventCollectionRef = collection(db, "events");

export const addEvent = async (eventData) => {
  await addDoc(eventCollectionRef, eventData);
};

export const fetchEvents = async () => {
  const data = await getDocs(eventCollectionRef);
  return data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
};

export const fetchEventById = async (id) => {
  const ref = doc(db, "events", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateEvent = async (id, updatedData) => {
  const ref = doc(db, "events", id);
  await updateDoc(ref, updatedData);
};

export const deleteEvent = async (id) => {
  await deleteDoc(doc(db, "events", id));
};
