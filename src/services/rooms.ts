import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, addDoc, setDoc } from 'firebase/firestore';
import type { Room, Participant } from '../types/committee';

// Fetches a single room's data
export const getRoom = async (roomId: string): Promise<Room | null> => {
  if (!db) return null;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (roomSnap.exists()) {
    return { ...roomSnap.data(), roomId: roomSnap.id } as Room;
  }
  return null;
};

// Sets up a real-time listener for a single room
export const streamRoom = (roomId: string, callback: (room: Room | null) => void) => {
  if (!db) {
    console.error('Firestore is not initialized.');
    return () => {}; // Return a no-op unsubscribe function
  }
  const roomRef = doc(db, 'rooms', roomId);
  const unsubscribe = onSnapshot(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.data(), roomId: snapshot.id } as Room);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
};

// Sets up a real-time listener for participants in a room
export const streamParticipants = (
  roomId: string,
  callback: (participants: Participant[]) => void,
) => {
  if (!db) {
    console.error('Firestore is not initialized.');
    return () => {};
  }
  const participantsRef = collection(db, 'rooms', roomId, 'participants');
  const q = query(participantsRef);
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map((doc) => ({
      ...doc.data(),
      userId: doc.id,
    })) as Participant[];
    callback(participants);
  });
  return unsubscribe;
};

// Creates a new room
export const createRoom = async (roomData: Omit<Room, 'roomId'>): Promise<Room | null> => {
  if (!isFirebaseConfigured || !db) return null;
  const roomsCollectionRef = collection(db, 'rooms');
  const docRef = await addDoc(roomsCollectionRef, roomData);
  return { ...roomData, roomId: docRef.id };
};

// Adds a participant to a room
export const addParticipant = async (roomId: string, participantData: Omit<Participant, 'userId'> & { userId: string }): Promise<void> => {
  if (!db) return;
  const participantRef = doc(db, 'rooms', roomId, 'participants', participantData.userId);
  await setDoc(participantRef, participantData);
};
