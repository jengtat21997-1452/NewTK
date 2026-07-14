import React, { useEffect } from 'react';
import { InventoryProvider, useInventory } from './store';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { Scanner } from './components/Scanner';
import { ItemForm } from './components/ItemForm';
import { PrintBarcode } from './components/PrintBarcode';
import { AuthScreen } from './components/AuthScreen';
import { UserManagement } from './components/UserManagement';
import { Button3D } from './components/ui/3D';
import { Moon, Sun, Monitor, Package, LayoutDashboard, Users, LogOut } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { view, setView, user, loadingAuth, signOut, userProfile, isGuest } = useInventory();
  const [isDark, setIsDark] = React.useState(() => {
    const stored = localStorage.getItem('theme');
    return stored !== 'light'; // Default to dark for Sleek Theme
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans">
        <p className="font-bold text-lg animate-pulse">กำลังโหลด...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans pb-24 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_4px_0_rgb(30,27,75)] text-white font-bold text-xl">
            TK
          </div>
          <div>
            <h1 className="text-lg font-bold text-indigo-900 dark:text-white tracking-tight leading-tight">TakanIT_Store</h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Inventory</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-xl p-1 border border-slate-300 dark:border-slate-700 shadow-inner flex items-center">
            <button 
              onClick={() => setIsDark(false)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${!isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Light
            </button>
            <button 
              onClick={() => setIsDark(true)}
              className={`px-3 py-1 text-xs rounded-lg transition-all ${isDark ? 'bg-slate-700 text-slate-200 shadow-sm' : 'text-slate-500'}`}
            >
              Dark
            </button>
          </div>
          <button onClick={signOut} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="ออกจากระบบ">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 max-w-2xl mx-auto h-full">
        {view === 'DASHBOARD' && <Dashboard />}
        {view === 'LIST' && <InventoryList />}
        {view === 'SCANNER' && <Scanner />}
        {view === 'FORM' && <ItemForm />}
        {view === 'PRINT_BARCODE' && <PrintBarcode />}
        {view === 'USER_MANAGEMENT' && <UserManagement />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-3 pb-safe">
        <div className="max-w-md mx-auto flex justify-between items-center gap-1 relative overflow-x-auto scrollbar-hide">
          
          <button 
            className={`flex flex-col items-center p-2 min-w-[4rem] flex-1 rounded-xl transition-colors ${view === 'DASHBOARD' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
            onClick={() => setView('DASHBOARD')}
          >
            <LayoutDashboard className={`w-6 h-6 mb-1 ${view === 'DASHBOARD' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''}`} />
            <span className="text-[10px] font-bold">หน้าหลัก</span>
          </button>

          <button 
            className={`flex flex-col items-center p-2 min-w-[4rem] flex-1 rounded-xl transition-colors ${view === 'SCANNER' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
            onClick={() => setView('SCANNER')}
          >
            <div className="mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/></svg>
            </div>
            <span className="text-[10px] font-bold">สแกน</span>
          </button>

          <button 
            className={`flex flex-col items-center p-2 min-w-[4rem] flex-1 rounded-xl transition-colors ${view === 'LIST' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
            onClick={() => setView('LIST')}
          >
            <Package className={`w-6 h-6 mb-1 ${view === 'LIST' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''}`} />
            <span className="text-[10px] font-bold">คลังสินค้า</span>
          </button>

          {userProfile?.role === 'admin' && (
            <button 
              className={`flex flex-col items-center p-2 min-w-[4rem] flex-1 rounded-xl transition-colors ${view === 'USER_MANAGEMENT' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-700 shadow-inner' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/30'}`}
              onClick={() => setView('USER_MANAGEMENT')}
            >
              <Users className={`w-6 h-6 mb-1 ${view === 'USER_MANAGEMENT' ? 'fill-indigo-100 dark:fill-indigo-900/50' : ''}`} />
              <span className="text-[10px] font-bold">สมาชิก</span>
            </button>
          )}

        </div>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}

