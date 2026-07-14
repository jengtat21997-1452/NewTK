import React, { useState } from 'react';
import { useInventory } from '../store';
import { Button3D, Card3D } from './ui/3D';
import { Package, Search, Plus, AlertTriangle, ArrowRight, Wrench, CalendarOff, Printer } from 'lucide-react';
import { isExpired } from '../lib/utils';
import { InventoryItem } from '../types';

export const Dashboard: React.FC = () => {
  const { items, setView, setEditingItem, userProfile } = useInventory();
  
  const lowStockItems = items.filter(i => i.quantity <= i.minQuantity);
  const expiredItems = items.filter(i => isExpired(i.expiryMonth));
  
  const totalMaterials = items.filter(i => i.category === 'MATERIAL').length;
  const totalEquipment = items.filter(i => i.category === 'EQUIPMENT').length;

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setView('FORM');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-4">
        <Button3D variant="primary" className="h-24 flex-col gap-2" onClick={() => setView('SCANNER')}>
          <Search className="w-8 h-8" />
          <span className="text-sm">สแกนรับ-จ่าย</span>
        </Button3D>
        {userProfile?.role === 'admin' && (
          <Button3D variant="success" className="h-24 flex-col gap-2" onClick={() => {
            setEditingItem(null);
            setView('FORM');
          }}>
            <Plus className="w-8 h-8" />
            <span className="text-sm">เพิ่มรายการใหม่</span>
          </Button3D>
        )}
        <Button3D variant="secondary" className="h-24 flex-col gap-2" onClick={() => setView('LIST')}>
          <Package className="w-8 h-8 text-indigo-500" />
          <span className="text-sm">คลังวัสดุ/อุปกรณ์</span>
        </Button3D>
        <Button3D variant="secondary" className="h-24 flex-col gap-2" onClick={() => setView('PRINT_BARCODE')}>
          <Printer className="w-8 h-8 text-indigo-500" />
          <span className="text-sm">พิมพ์บาร์โค้ด</span>
        </Button3D>
      </div>

      {/* Stat Grid (3D Style) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_0_rgb(226,232,240)] dark:shadow-[0_8px_0_rgb(15,23,42)] flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">วัสดุทั้งหมด</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalMaterials}</span>
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-bold">
              📦
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_0_rgb(226,232,240)] dark:shadow-[0_8px_0_rgb(15,23,42)] flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">อุปกรณ์ทั้งหมด</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalEquipment}</span>
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-bold">
              📹
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
          การแจ้งเตือนระบบ
        </h2>
        
        {lowStockItems.length === 0 && expiredItems.length === 0 && (
          <Card3D className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 shadow-none border-dashed border-2">
            <p className="text-slate-500 font-bold">ไม่มีรายการที่ต้องแจ้งเตือน</p>
          </Card3D>
        )}

        {lowStockItems.length > 0 && (
          <div className="bg-red-50 dark:bg-slate-900 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-[0_8px_0_rgb(254,226,226)] dark:shadow-[0_8px_0_rgb(69,10,10)] flex flex-col gap-3">
            <div className="font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> ของใกล้หมด / หมดแล้ว</span>
              <span className="text-2xl font-black">{lowStockItems.length}</span>
            </div>
            <div className="space-y-2 mt-2">
              {lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className={`flex items-center justify-between bg-white/50 dark:bg-slate-800/50 border border-red-100 dark:border-red-900/30 p-3 rounded-xl transition shadow-sm ${userProfile?.role === 'admin' ? 'cursor-pointer hover:bg-white dark:hover:bg-slate-800' : ''}`} onClick={() => userProfile?.role === 'admin' && handleEdit(item)}>
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{item.name}</span>
                  <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-2 py-1 rounded whitespace-nowrap">
                    เหลือ {item.quantity}
                  </span>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <div className="text-xs text-center text-red-500 font-bold cursor-pointer pt-2" onClick={() => setView('LIST')}>ดูทั้งหมด...</div>
              )}
            </div>
          </div>
        )}

        {expiredItems.length > 0 && (
          <div className="bg-orange-50 dark:bg-slate-900 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/50 shadow-[0_8px_0_rgb(255,237,213)] dark:shadow-[0_8px_0_rgb(67,20,7)] flex flex-col gap-3">
            <div className="font-bold text-orange-600 dark:text-orange-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><CalendarOff className="w-5 h-5" /> หมดอายุ / ถึงกำหนด</span>
              <span className="text-2xl font-black">{expiredItems.length}</span>
            </div>
            <div className="space-y-2 mt-2">
              {expiredItems.slice(0, 5).map(item => (
                <div key={item.id} className={`flex items-center justify-between bg-white/50 dark:bg-slate-800/50 border border-orange-100 dark:border-orange-900/30 p-3 rounded-xl transition shadow-sm ${userProfile?.role === 'admin' ? 'cursor-pointer hover:bg-white dark:hover:bg-slate-800' : ''}`} onClick={() => userProfile?.role === 'admin' && handleEdit(item)}>
                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{item.name}</span>
                  <span className="text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 px-2 py-1 rounded whitespace-nowrap">
                    {item.expiryMonth}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
