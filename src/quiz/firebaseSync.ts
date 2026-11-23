import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import type {
  ActivePlayer,
  CloudStatus,
  PlayerRecord,
  Question,
  SabotageEvent,
  SessionState,
  WaitingPlayer,
} from './types';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDc4enJaM3x9wFIWbIv7HSMJocCggAkP7E',
  authDomain: 'quizmrng.firebaseapp.com',
  projectId: 'quizmrng',
  storageBucket: 'quizmrng.firebasestorage.app',
  messagingSenderId: '110916327233',
  appId: '1:110916327233:web:54f4b5abb6730f2de173c0',
  measurementId: 'G-BZHTSHPJLN',
};

export const FIREBASE_APP_ID = 'quizmrng-public-v1';

let dbInstance: Firestore | null = null;

function getDb(): Firestore | null {
  return dbInstance;
}

export interface FirebaseCallbacks {
  deviceId: string;
  onStatusChange: (status: CloudStatus, label: string) => void;
  onLeaderboardUpdate: (records: PlayerRecord[], foundSelf: PlayerRecord | null) => void;
  onQuestionsUpdate: (questions: Question[]) => void;
  onSessionUpdate: (session: SessionState) => void;
  onWaitingPlayersUpdate: (players: WaitingPlayer[]) => void;
  onActivePlayersUpdate: (players: ActivePlayer[]) => void;
  onIncomingSabotage: (event: SabotageEvent) => void;
}

export function initFirebaseSync(callbacks: FirebaseCallbacks): () => void {
  const unsubscribers: (() => void)[] = [];
  let lastHandledSabotageTs = 0;

  (async () => {
    try {
      const app =
        getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const auth = getAuth(app);
      dbInstance = getFirestore(app);

      try {
        await signInAnonymously(auth);
      } catch {
        // Anonymous auth may be disabled in console; Firestore rules may still allow public read/write
      }

      const db = dbInstance;
      const baseSegments = ['artifacts', FIREBASE_APP_ID, 'public', 'data'] as const;

      // 1. Leaderboard Real-Time
      const lbCol = collection(db, ...baseSegments, 'leaderboard');
      unsubscribers.push(
        onSnapshot(
          lbCol,
          (snapshot) => {
            callbacks.onStatusChange('connected', 'Cloud Terhubung');
            const list: PlayerRecord[] = [];
            let foundSelf: PlayerRecord | null = null;
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as PlayerRecord;
              list.push(data);
              if (data.deviceId === callbacks.deviceId) {
                foundSelf = data;
              }
            });
            callbacks.onLeaderboardUpdate(list, foundSelf);
          },
          () => {
            callbacks.onStatusChange('error', 'Cek Rules Firestore!');
          }
        )
      );

      // 2. Bank Soal CRUD Real-Time
      const configDocRef = doc(db, ...baseSegments, 'config', 'questions_v2');
      unsubscribers.push(
        onSnapshot(configDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.items) && data.items.length > 0) {
              callbacks.onQuestionsUpdate(data.items as Question[]);
            }
          }
        })
      );

      // 3. Status Sesi Live / Bebas
      const sessionDocRef = doc(db, ...baseSegments, 'config', 'session');
      unsubscribers.push(
        onSnapshot(sessionDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const s = docSnap.data() as SessionState;
            if (s && s.mode) {
              callbacks.onSessionUpdate(s);
            }
          }
        })
      );

      // 4. Ruang Tunggu Live
      const waitCol = collection(db, ...baseSegments, 'waiting_room');
      unsubscribers.push(
        onSnapshot(waitCol, (snapshot) => {
          const wList: WaitingPlayer[] = [];
          snapshot.forEach((d) => wList.push(d.data() as WaitingPlayer));
          wList.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
          callbacks.onWaitingPlayersUpdate(wList);
        })
      );

      // 5. Pemain Aktif Real-Time (untuk Penguncian Mode & Sabotase Live)
      const activeCol = collection(db, ...baseSegments, 'active_players');
      unsubscribers.push(
        onSnapshot(activeCol, (snapshot) => {
          const aList: ActivePlayer[] = [];
          snapshot.forEach((d) => aList.push(d.data() as ActivePlayer));
          callbacks.onActivePlayersUpdate(aList);
        })
      );

      // 6. Sabotase / Debuff Real-Time untuk perangkat ini
      const sabotageDocRef = doc(
        db,
        ...baseSegments,
        'sabotage',
        callbacks.deviceId
      );
      unsubscribers.push(
        onSnapshot(sabotageDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const sData = docSnap.data() as SabotageEvent;
            if (
              sData &&
              sData.createdAt &&
              sData.createdAt > lastHandledSabotageTs &&
              Date.now() - sData.createdAt < 20000
            ) {
              lastHandledSabotageTs = sData.createdAt;
              callbacks.onIncomingSabotage(sData);
            }
          }
        })
      );
    } catch {
      callbacks.onStatusChange('error', 'Mode Offline / Lokal');
    }
  })();

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
  };
}

export async function saveSessionStateToCloud(payload: SessionState): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const ref = doc(db, 'artifacts', FIREBASE_APP_ID, 'public', 'data', 'config', 'session');
    await setDoc(ref, payload);
  } catch {
    // ignore network failure
  }
}

export async function joinWaitingRoomCloud(player: WaitingPlayer): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'waiting_room',
      player.deviceId
    );
    await setDoc(ref, player);
  } catch {
    // ignore
  }
}

export async function leaveWaitingRoomCloud(deviceId: string): Promise<void> {
  const db = getDb();
  if (!db || !deviceId) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'waiting_room',
      deviceId
    );
    await deleteDoc(ref);
  } catch {
    // ignore
  }
}

export async function upsertActivePlayerCloud(player: ActivePlayer): Promise<void> {
  const db = getDb();
  if (!db || !player.deviceId) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'active_players',
      player.deviceId
    );
    await setDoc(ref, player);
  } catch {
    // ignore
  }
}

export async function unregisterActivePlayerCloud(deviceId: string): Promise<void> {
  const db = getDb();
  if (!db || !deviceId) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'active_players',
      deviceId
    );
    await deleteDoc(ref);
  } catch {
    // ignore
  }
}

export async function clearActiveSessionPlayersCloud(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const activeCol = collection(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'active_players'
    );
    const waitCol = collection(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'waiting_room'
    );
    const [snapA, snapW] = await Promise.all([getDocs(activeCol), getDocs(waitCol)]);
    const dels: Promise<void>[] = [];
    snapA.forEach((d) => dels.push(deleteDoc(d.ref)));
    snapW.forEach((d) => dels.push(deleteDoc(d.ref)));
    await Promise.all(dels);
  } catch {
    // ignore
  }
}

export async function saveScoreToCloud(record: PlayerRecord): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'leaderboard',
      record.deviceId
    );
    await setDoc(ref, record);
    return true;
  } catch {
    return false;
  }
}

export async function fetchCloudLeaderboardOnce(): Promise<PlayerRecord[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const lbCol = collection(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'leaderboard'
    );
    const snap = await getDocs(lbCol);
    const list: PlayerRecord[] = [];
    snap.forEach((d) => list.push(d.data() as PlayerRecord));
    return list;
  } catch {
    return null;
  }
}

export async function saveQuestionsToCloud(questions: Question[]): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'config',
      'questions_v2'
    );
    await setDoc(ref, { items: questions, updatedAt: new Date().toISOString() });
    return true;
  } catch {
    return false;
  }
}

export async function sendSabotageToCloud(payload: SabotageEvent): Promise<void> {
  const db = getDb();
  if (!db || !payload.targetDeviceId) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'sabotage',
      payload.targetDeviceId
    );
    await setDoc(ref, payload);
  } catch {
    // ignore
  }
}

export async function deleteSingleParticipantFromCloud(
  targetDeviceId: string
): Promise<void> {
  const db = getDb();
  if (!db || !targetDeviceId) return;
  try {
    const ref = doc(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'leaderboard',
      targetDeviceId
    );
    await deleteDoc(ref);
  } catch {
    // ignore
  }
}

export async function resetCloudLeaderboard(): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const lbCol = collection(
      db,
      'artifacts',
      FIREBASE_APP_ID,
      'public',
      'data',
      'leaderboard'
    );
    const snap = await getDocs(lbCol);
    const dels: Promise<void>[] = [];
    snap.forEach((d) => dels.push(deleteDoc(d.ref)));
    await Promise.all(dels);
  } catch {
    // ignore
  }
}
