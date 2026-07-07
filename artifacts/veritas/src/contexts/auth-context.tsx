import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  sendPasswordResetEmail, type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logAuthEvent } from "@/lib/activity-logger";

export type UserRole = "educator" | "admin" | "auditor";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  school?: string;
  gradeLevel?: string;
}

interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole, school?: string, gradeLevel?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) setUserProfile(snap.data() as UserProfile);
        } catch {
          setUserProfile({ uid: user.uid, name: user.displayName ?? "Teacher", email: user.email ?? "", role: "educator" });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Fire-and-forget — never block login on Firestore write
    logAuthEvent(cred.user.uid, "login");
  }

  async function register(email: string, password: string, name: string, role: UserRole, school = "", gradeLevel = "") {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = { uid: cred.user.uid, name, email, role, school, gradeLevel };
    try {
      await setDoc(doc(db, "users", cred.user.uid), { ...profile, createdAt: serverTimestamp() });
    } catch {
      // Firestore write failed — profile stored locally only
    }
    // Log registration as first login event
    logAuthEvent(cred.user.uid, "login");
    setUserProfile(profile);
  }

  async function logout() {
    const uid = currentUser?.uid;
    if (uid) await logAuthEvent(uid, "logout");
    await signOut(auth);
    setUserProfile(null);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, login, register, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
