import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { RoomMessage } from '../types/committee';
import { normalizeChatText } from './committeeRoomLogic';

function requireDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }
  return db;
}

export function streamMessages(roomId: string, callback: (messages: RoomMessage[]) => void) {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(
      (d) => ({ ...d.data(), messageId: d.id }) as RoomMessage,
    );
    callback(messages);
  });
}

export async function sendMessage(input: {
  roomId: string;
  userId: string;
  displayName: string;
  text: string;
}): Promise<RoomMessage> {
  const database = requireDb();
  const text = normalizeChatText(input.text);
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error('Missing seat label for message.');

  const messageRef = doc(collection(database, 'rooms', input.roomId, 'messages'));
  const message: RoomMessage = {
    messageId: messageRef.id,
    userId: input.userId,
    displayName,
    text,
    createdAt: Date.now(),
  };
  const { messageId: _id, ...payload } = message;
  await setDoc(messageRef, payload);
  return message;
}

/**
 * Rewrite stored seat labels on a user's past messages (so after they leave,
 * history still shows their latest role/country).
 */
export async function syncMessageLabelsForUser(
  roomId: string,
  userId: string,
  displayName: string,
): Promise<void> {
  const database = requireDb();
  const label = displayName.trim();
  if (!label) return;

  const snap = await getDocs(collection(database, 'rooms', roomId, 'messages'));
  const own = snap.docs.filter((d) => d.data().userId === userId);
  if (own.length === 0) return;

  const CHUNK = 400;
  for (let i = 0; i < own.length; i += CHUNK) {
    const batch = writeBatch(database);
    for (const d of own.slice(i, i + CHUNK)) {
      batch.update(d.ref, { displayName: label });
    }
    await batch.commit();
  }
}
