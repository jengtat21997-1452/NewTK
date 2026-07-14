import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { InventoryItem, ViewState, UserProfile } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemByBarcode: (barcode: string) => InventoryItem | undefined;
  view: ViewState;
  setView: (view: ViewState) => void;
  editingItem: InventoryItem | null;
  setEditingItem: (item: InventoryItem | null) => void;
  
  // Auth
  user: User | null;
  userProfile: UserProfile | null;
  loadingAuth: boolean;
  isGuest: boolean;
  setIsGuest: (guest: boolean) => void;
  signOut: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch user profile to get role
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setUserProfile({ uid: firebaseUser.uid, ...profileSnap.data() } as UserProfile);
        } else {
          // Defaults
          const defaultProfile: UserProfile = { uid: firebaseUser.uid, email: firebaseUser.email || '', role: 'user' };
          setUserProfile(defaultProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Items Listener
  useEffect(() => {
    if (!user && !isGuest) {
      setItems([]);
      return;
    }
    
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const fetchedItems: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        fetchedItems.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(fetchedItems);
    });
    return () => unsubscribe();
  }, [user, isGuest]);

  const signOut = async () => {
    setIsGuest(false);
    await firebaseSignOut(auth);
  };

  const addItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!user && !isGuest) return;
    const newItemRef = doc(collection(db, 'inventory'));
    const newItem = {
      ...itemData,
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(newItemRef, newItem);
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    if (!user && !isGuest) return;
    const itemRef = doc(db, 'inventory', id);
    await updateDoc(itemRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  };

  const deleteItem = async (id: string) => {
    if (!user && !isGuest) return;
    const itemRef = doc(db, 'inventory', id);
    await deleteDoc(itemRef);
  };

  const getItemByBarcode = (barcode: string) => {
    return items.find(item => item.barcode === barcode);
  };

  return (
    <InventoryContext.Provider value={{
      items, addItem, updateItem, deleteItem, getItemByBarcode,
      view, setView, editingItem, setEditingItem,
      user, userProfile, loadingAuth, isGuest, setIsGuest, signOut
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};
