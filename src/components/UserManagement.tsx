import React, { useEffect, useState } from 'react';
import { useInventory } from '../store';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Card3D, Button3D } from './ui/3D';
import { User, Shield, ShieldOff, Edit2, Trash2, X, Check } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { userProfile } = useInventory();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetched: UserProfile[] = [];
      snapshot.forEach(doc => {
        fetched.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(fetched);
    });

    return () => unsubscribe();
  }, [userProfile]);

  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <ShieldOff className="w-12 h-12 mb-4" />
        <p className="font-bold">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  const handleDelete = (targetUser: UserProfile) => {
    if (targetUser.uid === userProfile.uid) {
      alert("ไม่สามารถลบตัวเองได้");
      return;
    }
    setDeleteConfirmId(targetUser.uid);
  };

  const confirmDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการลบผู้ใช้");
    }
  };

  const cancelDelete = () => setDeleteConfirmId(null);

  const startEdit = (user: UserProfile) => {
    if (user.uid === userProfile.uid) {
      alert("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
      return;
    }
    setEditingUserId(user.uid);
    setEditRole(user.role);
  };

  const saveEdit = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: editRole });
      setEditingUserId(null);
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col pb-24">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-indigo-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">จัดการสมาชิก</h2>
      </div>

      <div className="space-y-3">
        {users.map((u) => (
          <Card3D key={u.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{u.email}</p>
                {editingUserId === u.uid ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500">สิทธิ์:</span>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as 'admin' | 'user')}
                      className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-500">
                    สิทธิ์: <span className={u.role === 'admin' ? 'text-indigo-500 font-bold' : ''}>{u.role}</span>
                  </p>
                )}
              </div>
            </div>
            
            {u.uid !== userProfile.uid && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                {editingUserId === u.uid ? (
                  <>
                    <Button3D 
                      variant="success" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => saveEdit(u.uid)}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button3D>
                    <Button3D 
                      variant="secondary" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => setEditingUserId(null)}
                    >
                      <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button3D>
                  </>
                ) : deleteConfirmId === u.uid ? (
                  <>
                    <span className="text-xs text-red-500 font-bold mr-2">ลบแน่ใจไหม?</span>
                    <Button3D 
                      variant="danger" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => confirmDelete(u.uid)}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </Button3D>
                    <Button3D 
                      variant="secondary" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={cancelDelete}
                    >
                      <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button3D>
                  </>
                ) : (
                  <>
                    <Button3D 
                      variant="secondary" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => startEdit(u)}
                    >
                      <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Button3D>
                    <Button3D 
                      variant="danger" 
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => handleDelete(u)}
                    >
                      <Trash2 className="w-4 h-4 text-red-100" />
                    </Button3D>
                  </>
                )}
              </div>
            )}
          </Card3D>
        ))}
      </div>
    </div>
  );
};
