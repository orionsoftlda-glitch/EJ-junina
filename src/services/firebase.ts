/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Standard list of participants in a traditional "Quadrilha Junina"
export const participantes = [
  "Amanda Gomes",
  "Aline Rocha",
  "Ana Júlia",
  "Antônio Carlos",
  "Beatriz Costa",
  "Bruno Henrique",
  "Camila Oliveira",
  "Carlos Eduardo",
  "Fernanda Rodrigues",
  "Francisca Souza",
  "Gabriel Santos",
  "Geraldo Santos",
  "João Pedro",
  "José Alencar",
  "Juliana Pereira",
  "Larissa Melo",
  "Letícia Barbosa",
  "Lucas Gabriel",
  "Luiz Fernando",
  "Manoel Lima",
  "Marcos Vinícius",
  "Maria Clara",
  "Matheus Felipe",
  "Patricia Mendes",
  "Raimunda Silva",
  "Renato Araújo",
  "Rodrigo Alves",
  "Sebastião Costa",
  "Thiago Neves",
  "Valéria Souza"
];

// Defined categories and questions for Prêmio da Quadrilha
export interface Question {
  id: string;
  label: string;
}

export interface Category {
  title: string;
  icon: string;
  questions: Question[];
}

export const CATEGORIES: Category[] = [
  {
    title: "Pontualidade",
    icon: "Clock",
    questions: [
      { id: "pontual", label: "Quem foi o brincante mais pontual?" },
      { id: "atrasado", label: "Quem chegou mais atrasado aos ensaios?" },
      { id: "correndo", label: "Quem sempre chegava correndo?" }
    ]
  },
  {
    title: "Animação",
    icon: "Sparkles",
    questions: [
      { id: "animado", label: "Quem foi o brincante mais animado?" },
      { id: "astral", label: "Quem levantava o astral do grupo?" },
      { id: "energia", label: "Quem tinha a melhor energia nos ensaios?" },
      { id: "empolgava", label: "Quem mais empolgava a turma?" }
    ]
  },
  {
    title: "Coreografia",
    icon: "Activity",
    questions: [
      { id: "evoluiu", label: "Quem mais evoluiu durante os ensaios?" },
      { id: "ajudava", label: "Quem mais ajudava os colegas a aprender?" }
    ]
  },
  {
    title: "Personalidade",
    icon: "Smile",
    questions: [
      { id: "engracado", label: "Quem foi o mais engraçado?" },
      { id: "rir", label: "Quem mais fazia todo mundo rir?" },
      { id: "timido", label: "Quem era o mais tímido?" },
      { id: "tagarela", label: "Quem era o mais tagarela?" },
      { id: "concentrado", label: "Quem era o mais concentrado?" }
    ]
  },
  {
    title: "Bastidores",
    icon: "Layers",
    questions: [
      { id: "trabalho", label: "Quem deu mais trabalho? (em tom de brincadeira)" },
      { id: "esquecia", label: "Quem mais esquecia alguma coisa?" },
      { id: "repetir", label: "Quem mais pedia para repetir o ensaio?" },
      { id: "perguntas", label: "Quem mais fazia perguntas?" },
      { id: "improvisava", label: "Quem mais improvisava?" }
    ]
  },
  {
    title: "Estilo",
    icon: "Flame",
    questions: [
      { id: "presenca", label: "Quem tinha mais presença de palco?" },
      { id: "personagem", label: "Quem mais incorporava o personagem?" }
    ]
  },
  {
    title: "Espírito de equipe",
    icon: "Heart",
    questions: [
      { id: "dedicacao", label: "Quem demonstrou mais dedicação?" }
    ]
  },
  {
    title: "Extras",
    icon: "Award",
    questions: [
      { id: "caras_bocas", label: "Quem mais fazia caras e bocas?" },
      { id: "historias", label: "Quem mais rendia histórias engraçadas?" },
      { id: "fotogenico", label: "Quem era o mais fotogênico?" },
      { id: "videos", label: "Quem mais fazia vídeos nos bastidores?" },
      { id: "cantava", label: "Quem mais cantava durante os ensaios?" },
      { id: "apelidos", label: "Quem mais inventava apelidos?" },
      { id: "oscar", label: "Quem mais merecia um Oscar pela atuação?" }
    ]
  }
];

// Firebase Configuration from real deployed json settings
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId
};

// Force real mode (non-simulator) since we have set up the production database
const isSimulatorMode = false;

// Real Firebase initialization
let app;
let realAuth: any = null;
let realDb: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  realAuth = getAuth(app);
  // Use the specific firestoreDatabaseId provided in the JSON configuration
  realDb = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || undefined);
  console.log("🔥 Firebase initialized in real mode with database ID:", firebaseConfigJson.firestoreDatabaseId);
} catch (err) {
  console.error("Failed to initialize Firebase in real mode", err);
}

// -------------------------------------------------------------
// LOCAL STORAGE SIMULATOR IMPLEMENTATION
// -------------------------------------------------------------

interface SimulatedUser {
  uid: string;
  nome: string;
  email: string;
  foto: string;
  votou: boolean;
  dataVoto: string | null;
  isAdmin?: boolean;
}

interface SimulatedVote {
  userId: string;
  votos: Record<string, string>;
  timestamp: string;
}

// Set up predefined administrators
const ADMIN_EMAILS = [
  "ofsillvadigital@gmail.com", // Main requestor
  "admin@quadrilha.com.br",
  "diretoria@quadrilha.com.br"
];

// Load simulation database or seed it with realistic test data
const getSimulatedUsers = (): Record<string, SimulatedUser> => {
  const data = localStorage.getItem("quadrilha_users");
  if (!data) {
    // Seed with a few mock users who have already voted (so statistics are immediately interesting!)
    const initialUsers: Record<string, SimulatedUser> = {
      "mock_uid_1": {
        uid: "mock_uid_1",
        nome: "Thiago Oliveira",
        email: "thiago@quadrilha.com.br",
        foto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Thiago",
        votou: true,
        dataVoto: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      "mock_uid_2": {
        uid: "mock_uid_2",
        nome: "Gabriela Fernandes",
        email: "gabi@quadrilha.com.br",
        foto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gabriela",
        votou: true,
        dataVoto: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      "mock_uid_3": {
        uid: "mock_uid_3",
        nome: "Renato Sousa",
        email: "renato@quadrilha.com.br",
        foto: "https://api.dicebear.com/7.x/adventurer/svg?seed=Renato",
        votou: true,
        dataVoto: new Date(Date.now() - 3600000 * 10).toISOString(),
      }
    };
    localStorage.setItem("quadrilha_users", JSON.stringify(initialUsers));
    return initialUsers;
  }
  return JSON.parse(data);
};

const getSimulatedVotes = (): Record<string, SimulatedVote> => {
  const data = localStorage.getItem("quadrilha_votes");
  if (!data) {
    // Seed with mock votes
    const initialVotes: Record<string, SimulatedVote> = {
      "mock_uid_1": {
        userId: "mock_uid_1",
        votos: {
          pontual: "João Pedro",
          atrasado: "Sebastião Costa",
          correndo: "Maria Clara",
          animado: "Larissa Melo",
          astral: "Lucas Gabriel",
          energia: "Beatriz Costa",
          empolgava: "Geraldo Santos",
          evoluiu: "Francisca Souza",
          ajudava: "Ana Júlia",
          engracado: "Carlos Eduardo",
          rir: "Manoel Lima",
          timido: "Sebastião Costa",
          tagarela: "Camila Oliveira",
          concentrado: "Antônio Carlos",
          trabalho: "Marcos Vinícius",
          esquecia: "Juliana Pereira",
          repetir: "Beatriz Costa",
          perguntas: "Rodrigo Alves",
          improvisava: "Larissa Melo",
          presenca: "Lucas Gabriel",
          personagem: "Valéria Souza",
          dedicacao: "Ana Júlia",
          caras_bocas: "Carlos Eduardo",
          historias: "Manoel Lima",
          fotogenico: "Camila Oliveira",
          videos: "Larissa Melo",
          cantava: "Thiago Neves",
          apelidos: "Manoel Lima",
          oscar: "Valéria Souza"
        },
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      "mock_uid_2": {
        userId: "mock_uid_2",
        votos: {
          pontual: "Antônio Carlos",
          atrasado: "Larissa Melo",
          correndo: "Raimunda Silva",
          animado: "Lucas Gabriel",
          astral: "Manoel Lima",
          energia: "Juliana Pereira",
          empolgava: "Larissa Melo",
          evoluiu: "Francisca Souza",
          ajudava: "João Pedro",
          engracado: "Carlos Eduardo",
          rir: "Carlos Eduardo",
          timido: "Sebastião Costa",
          tagarela: "Camila Oliveira",
          concentrado: "Antônio Carlos",
          trabalho: "Manoel Lima",
          esquecia: "Thiago Neves",
          repetir: "Beatriz Costa",
          perguntas: "Rodrigo Alves",
          improvisava: "Larissa Melo",
          presenca: "Lucas Gabriel",
          personagem: "Valéria Souza",
          dedicacao: "Ana Júlia",
          caras_bocas: "Carlos Eduardo",
          historias: "Manoel Lima",
          fotogenico: "Juliana Pereira",
          videos: "Beatriz Costa",
          cantava: "Thiago Neves",
          apelidos: "Manoel Lima",
          oscar: "Manoel Lima"
        },
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      "mock_uid_3": {
        userId: "mock_uid_3",
        votos: {
          pontual: "Antônio Carlos",
          atrasado: "Sebastião Costa",
          correndo: "Maria Clara",
          animado: "Larissa Melo",
          astral: "Lucas Gabriel",
          energia: "Beatriz Costa",
          empolgava: "Geraldo Santos",
          evoluiu: "Francisca Souza",
          ajudava: "Ana Júlia",
          engracado: "Carlos Eduardo",
          rir: "Manoel Lima",
          timido: "Sebastião Costa",
          tagarela: "Camila Oliveira",
          concentrado: "Antônio Carlos",
          trabalho: "Marcos Vinícius",
          esquecia: "Juliana Pereira",
          repetir: "Beatriz Costa",
          perguntas: "Rodrigo Alves",
          improvisava: "Larissa Melo",
          presenca: "Lucas Gabriel",
          personagem: "Valéria Souza",
          dedicacao: "Ana Júlia",
          caras_bocas: "Carlos Eduardo",
          historias: "Manoel Lima",
          fotogenico: "Camila Oliveira",
          videos: "Larissa Melo",
          cantava: "Thiago Neves",
          apelidos: "Manoel Lima",
          oscar: "Valéria Souza"
        },
        timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
      }
    };
    localStorage.setItem("quadrilha_votes", JSON.stringify(initialVotes));
    return initialVotes;
  }
  return JSON.parse(data);
};

const saveSimulatedUsers = (users: Record<string, SimulatedUser>) => {
  localStorage.setItem("quadrilha_users", JSON.stringify(users));
};

const saveSimulatedVotes = (votes: Record<string, SimulatedVote>) => {
  localStorage.setItem("quadrilha_votes", JSON.stringify(votes));
};

// Simple simulated active session
let simulatedCurrentUser: SimulatedUser | null = null;
const authCallbacks = new Set<(user: SimulatedUser | null) => void>();

// -------------------------------------------------------------
// PUBLIC UNIFIED SERVICE INTERFACE
// -------------------------------------------------------------

export interface AppUser {
  uid: string;
  nome: string;
  email: string;
  foto: string;
  votou: boolean;
  dataVoto: string | null;
  isAdmin: boolean;
}

export const isSimulated = () => isSimulatorMode;

/**
 * Register a callback to listen to Auth status changes.
 */
export const listenToAuth = (callback: (user: AppUser | null) => void): (() => void) => {
  // First check if there is an active credential-based admin session
  const directAdmin = localStorage.getItem("quadrilha_session_admin_direct");
  if (directAdmin === "true") {
    const adminUser: AppUser = {
      uid: "admin_credential_user",
      nome: "Administrador Geral",
      email: "admin@quadrilha.com.br",
      foto: "https://api.dicebear.com/7.x/adventurer/svg?seed=AdminGeral",
      votou: false,
      dataVoto: null,
      isAdmin: true,
    };
    callback(adminUser);
    authCallbacks.add(callback);
    return () => {
      authCallbacks.delete(callback);
    };
  }

  if (!isSimulatorMode) {
    const realUnsubscribe = onAuthStateChanged(realAuth, async (firebaseUser) => {
      if (localStorage.getItem("quadrilha_session_admin_direct") === "true") {
        return; // Ignore if manual admin direct is active
      }
      if (firebaseUser) {
        const uEmail = firebaseUser.email || "";
        const isAdmin = ADMIN_EMAILS.includes(uEmail.toLowerCase());

        // Get or Create user document in Firestore
        const userRef = doc(realDb, "usuarios", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let uData: AppUser;
        if (userSnap.exists()) {
          const data = userSnap.data();
          uData = {
            uid: firebaseUser.uid,
            nome: data.nome || firebaseUser.displayName || "Usuário",
            email: uEmail,
            foto: data.foto || firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
            votou: !!data.votou,
            dataVoto: data.dataVoto ? (typeof data.dataVoto === "string" ? data.dataVoto : data.dataVoto.toDate().toISOString()) : null,
            isAdmin,
          };
        } else {
          uData = {
            uid: firebaseUser.uid,
            nome: firebaseUser.displayName || "Usuário",
            email: uEmail,
            foto: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
            votou: false,
            dataVoto: null,
            isAdmin,
          };
          // Save to Firestore
          await setDoc(userRef, {
            nome: uData.nome,
            email: uData.email,
            foto: uData.foto,
            votou: false,
            dataVoto: null,
          });
        }
        callback(uData);
      } else {
        callback(null);
      }
    });

    authCallbacks.add(callback);
    return () => {
      realUnsubscribe();
      authCallbacks.delete(callback);
    };
  } else {
    // Simulator flow
    const savedSession = localStorage.getItem("quadrilha_session_user");
    if (savedSession) {
      simulatedCurrentUser = JSON.parse(savedSession);
    }
    callback(simulatedCurrentUser ? { ...simulatedCurrentUser, isAdmin: ADMIN_EMAILS.includes(simulatedCurrentUser.email.toLowerCase()) } : null);
    authCallbacks.add(callback);
    return () => {
      authCallbacks.delete(callback);
    };
  }
};

/**
 * Signs in using Google. In simulator mode, allows typing details to ease testing multiple accounts.
 */
export const loginWithGoogle = async (simulatedDetails?: { nome: string; email: string }): Promise<AppUser> => {
  localStorage.removeItem("quadrilha_session_admin_direct");
  if (!isSimulatorMode) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(realAuth, provider);
    const firebaseUser = result.user;
    const uEmail = firebaseUser.email || "";
    const isAdmin = ADMIN_EMAILS.includes(uEmail.toLowerCase());

    const userRef = doc(realDb, "usuarios", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    let uData: AppUser;
    if (userSnap.exists()) {
      const data = userSnap.data();
      uData = {
        uid: firebaseUser.uid,
        nome: data.nome || firebaseUser.displayName || "Usuário",
        email: uEmail,
        foto: data.foto || firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
        votou: !!data.votou,
        dataVoto: data.dataVoto ? (typeof data.dataVoto === "string" ? data.dataVoto : data.dataVoto.toDate().toISOString()) : null,
        isAdmin,
      };
    } else {
      uData = {
        uid: firebaseUser.uid,
        nome: firebaseUser.displayName || "Usuário",
        email: uEmail,
        foto: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
        votou: false,
        dataVoto: null,
        isAdmin,
      };
      await setDoc(userRef, {
        nome: uData.nome,
        email: uData.email,
        foto: uData.foto,
        votou: false,
        dataVoto: null,
      });
    }
    return uData;
  } else {
    // Simulator flow
    const name = simulatedDetails?.nome || "Brincante Convidado";
    const email = (simulatedDetails?.email || "convidado@quadrilha.com.br").toLowerCase();
    const uid = "sim_" + email.replace(/[^a-zA-Z0-9]/g, "_");
    const foto = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const users = getSimulatedUsers();
    let uData: SimulatedUser;

    if (users[uid]) {
      uData = users[uid];
    } else {
      uData = {
        uid,
        nome: name,
        email,
        foto,
        votou: false,
        dataVoto: null,
      };
      users[uid] = uData;
      saveSimulatedUsers(users);
    }

    const appUser: AppUser = {
      ...uData,
      isAdmin: ADMIN_EMAILS.includes(uData.email.toLowerCase()),
    };

    simulatedCurrentUser = uData;
    localStorage.setItem("quadrilha_session_user", JSON.stringify(uData));

    // Notify listeners
    authCallbacks.forEach(cb => cb(appUser));
    return appUser;
  }
};

/**
 * Signs in using custom admin credentials (User: Admin, Pass: Kadu2026)
 */
export const loginWithCredentials = async (username: string, password: string): Promise<AppUser> => {
  if (username.trim().toLowerCase() === "admin" && password === "Kadu2026") {
    localStorage.setItem("quadrilha_session_admin_direct", "true");
    
    const adminUser: AppUser = {
      uid: "admin_credential_user",
      nome: "Administrador Geral",
      email: "admin@quadrilha.com.br",
      foto: "https://api.dicebear.com/7.x/adventurer/svg?seed=AdminGeral",
      votou: false,
      dataVoto: null,
      isAdmin: true,
    };
    
    // Notify all active listeners
    authCallbacks.forEach(cb => cb(adminUser));
    return adminUser;
  } else {
    throw new Error("Usuário ou senha inválidos.");
  }
};

/**
 * Sign out.
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem("quadrilha_session_admin_direct");
  if (!isSimulatorMode) {
    await signOut(realAuth);
    authCallbacks.forEach(cb => cb(null));
  } else {
    simulatedCurrentUser = null;
    localStorage.removeItem("quadrilha_session_user");
    authCallbacks.forEach(cb => cb(null));
  }
};

/**
 * Submits a vote
 */
export const submitVote = async (userId: string, votes: Record<string, string>): Promise<void> => {
  const timestampStr = new Date().toISOString();

  if (!isSimulatorMode) {
    // Create / Update document in Firestore
    const voteRef = doc(realDb, "votos", userId);
    const userRef = doc(realDb, "usuarios", userId);

    // Write both docs (can use a Firestore write batch)
    const batch = writeBatch(realDb);
    batch.set(voteRef, {
      userId,
      votos: votes,
      timestamp: Timestamp.fromDate(new Date()),
    });
    batch.update(userRef, {
      votou: true,
      dataVoto: Timestamp.fromDate(new Date()),
    });

    await batch.commit();
  } else {
    // Simulator flow
    const users = getSimulatedUsers();
    const allVotes = getSimulatedVotes();

    if (users[userId]) {
      users[userId].votou = true;
      users[userId].dataVoto = timestampStr;
      saveSimulatedUsers(users);
    }

    allVotes[userId] = {
      userId,
      votos: votes,
      timestamp: timestampStr,
    };
    saveSimulatedVotes(allVotes);

    // Update active session user if it's the current user
    if (simulatedCurrentUser && simulatedCurrentUser.uid === userId) {
      simulatedCurrentUser.votou = true;
      simulatedCurrentUser.dataVoto = timestampStr;
      localStorage.setItem("quadrilha_session_user", JSON.stringify(simulatedCurrentUser));
      
      const appUser: AppUser = {
        ...simulatedCurrentUser,
        isAdmin: ADMIN_EMAILS.includes(simulatedCurrentUser.email.toLowerCase()),
      };
      authCallbacks.forEach(cb => cb(appUser));
    }
  }
};

/**
 * Get administrator statistics for admin screen
 */
export interface AdminStats {
  totalUsers: number;
  totalVotes: number;
  votedUserPercentage: number;
  questionResults: Record<string, Array<{ name: string; votes: number; percentage: number }>>;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  let rawUsers: any[] = [];
  let rawVotes: any[] = [];

  if (!isSimulatorMode) {
    // Fetch users
    const usersSnap = await getDocs(collection(realDb, "usuarios"));
    usersSnap.forEach(docSnap => {
      rawUsers.push(docSnap.data());
    });

    // Fetch votes
    const votesSnap = await getDocs(collection(realDb, "votos"));
    votesSnap.forEach(docSnap => {
      rawVotes.push(docSnap.data());
    });
  } else {
    // Simulator flow
    rawUsers = Object.values(getSimulatedUsers());
    rawVotes = Object.values(getSimulatedVotes());
  }

  const totalUsers = rawUsers.length;
  const totalVotes = rawVotes.length;
  const votedUserPercentage = totalUsers > 0 ? Math.round((totalVotes / totalUsers) * 100) : 0;

  // Process question rankings
  // Initialize dynamic empty counters for all defined questions
  const questionResults: Record<string, Array<{ name: string; votes: number; percentage: number }>> = {};

  CATEGORIES.forEach(cat => {
    cat.questions.forEach(q => {
      questionResults[q.id] = [];
    });
  });

  // Count votes per participant per question
  const voteCounters: Record<string, Record<string, number>> = {};
  CATEGORIES.forEach(cat => {
    cat.questions.forEach(q => {
      voteCounters[q.id] = {};
    });
  });

  rawVotes.forEach(voteDoc => {
    const answers = voteDoc.votos || {};
    Object.keys(answers).forEach(qId => {
      const selectedParticipant = answers[qId];
      if (selectedParticipant && voteCounters[qId]) {
        voteCounters[qId][selectedParticipant] = (voteCounters[qId][selectedParticipant] || 0) + 1;
      }
    });
  });

  // Calculate percentages and sort rankings
  Object.keys(voteCounters).forEach(qId => {
    const counts = voteCounters[qId];
    const ranking = Object.keys(counts).map(pName => {
      const count = counts[pName];
      return {
        name: pName,
        votes: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
      };
    });

    // Sort descending by votes
    ranking.sort((a, b) => b.votes - a.votes);
    questionResults[qId] = ranking;
  });

  return {
    totalUsers,
    totalVotes,
    votedUserPercentage,
    questionResults,
  };
};

/**
 * Reset all voting results and wipe votes database
 */
export const resetVoting = async (): Promise<void> => {
  if (!isSimulatorMode) {
    const usersSnap = await getDocs(collection(realDb, "usuarios"));
    const votesSnap = await getDocs(collection(realDb, "votos"));

    // Reset each user's status to not voted
    const batch = writeBatch(realDb);
    usersSnap.forEach(userDoc => {
      const userRef = doc(realDb, "usuarios", userDoc.id);
      batch.update(userRef, {
        votou: false,
        dataVoto: null,
      });
    });

    // Delete each vote document
    votesSnap.forEach(voteDoc => {
      const voteRef = doc(realDb, "votos", voteDoc.id);
      batch.delete(voteRef);
    });

    await batch.commit();
  } else {
    // Simulator flow
    const users = getSimulatedUsers();
    // Keep users but reset their voted status
    Object.keys(users).forEach(uid => {
      users[uid].votou = false;
      users[uid].dataVoto = null;
    });

    saveSimulatedUsers(users);
    saveSimulatedVotes({});

    // Reset current active session if any
    if (simulatedCurrentUser) {
      simulatedCurrentUser.votou = false;
      simulatedCurrentUser.dataVoto = null;
      localStorage.setItem("quadrilha_session_user", JSON.stringify(simulatedCurrentUser));
      
      const appUser: AppUser = {
        ...simulatedCurrentUser,
        isAdmin: ADMIN_EMAILS.includes(simulatedCurrentUser.email.toLowerCase()),
      };
      authCallbacks.forEach(cb => cb(appUser));
    }
  }
};

/**
 * Fetches the dynamic list of participants from Firestore.
 * If the collection is empty, it seeds it with the default list.
 */
export const getParticipantes = async (): Promise<string[]> => {
  if (isSimulatorMode) {
    const saved = localStorage.getItem("quadrilha_dynamic_participantes");
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem("quadrilha_dynamic_participantes", JSON.stringify(participantes));
    return participantes;
  }

  try {
    const colRef = collection(realDb, "participantes");
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed initial participants
      const batch = writeBatch(realDb);
      participantes.forEach((pName) => {
        const docId = pName.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const docRef = doc(realDb, "participantes", docId);
        batch.set(docRef, { name: pName });
      });
      await batch.commit();
      return participantes;
    }

    const list: string[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.name) {
        list.push(data.name);
      }
    });
    list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return list;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return participantes;
  }
};

/**
 * Adds a new participant.
 */
export const addParticipant = async (name: string): Promise<string[]> => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("O nome não pode estar em branco.");

  if (isSimulatorMode) {
    const current = await getParticipantes();
    if (current.includes(trimmedName)) {
      throw new Error("Este brincante já está cadastrado.");
    }
    const updated = [...current, trimmedName].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    localStorage.setItem("quadrilha_dynamic_participantes", JSON.stringify(updated));
    return updated;
  }

  const docId = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const docRef = doc(realDb, "participantes", docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    throw new Error("Este brincante já está cadastrado.");
  }

  await setDoc(docRef, { name: trimmedName });
  return getParticipantes();
};

/**
 * Deletes a participant.
 */
export const deleteParticipant = async (name: string): Promise<string[]> => {
  if (isSimulatorMode) {
    const current = await getParticipantes();
    const updated = current.filter(p => p !== name);
    localStorage.setItem("quadrilha_dynamic_participantes", JSON.stringify(updated));
    return updated;
  }

  const docId = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const docRef = doc(realDb, "participantes", docId);
  await deleteDoc(docRef);
  return getParticipantes();
};

