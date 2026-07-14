import React, { useState } from 'react';
import { useInventory } from '../store';
import { Button3D } from './ui/3D';
import { Printer, CheckSquare, Square, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { InventoryItem } from '../types';

export const PrintBarcode: React.FC = () => {
  const { items, setView } = useInventory();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const printSelected = () => {
    if (selectedIds.size === 0) {
      alert('กรุณาเลือกรายการที่ต้องการพิมพ์');
      return;
    }
    
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const exportSelected = () => {
    if (selectedIds.size === 0) {
      alert('กรุณาเลือกรายการที่ต้องการส่งออก');
      return;
    }
    const itemsToExport = items.filter(item => selectedIds.has(item.id));
    
    // Create CSV content
    const headers = ['ชื่อรายการ', 'หมวดหมู่', 'บาร์โค้ด', 'จำนวนคงเหลือ'];
    const csvRows = [
      headers.join(','),
      ...itemsToExport.map(item => [
        `"${item.name}"`,
        `"${item.category === 'MATERIAL' ? 'วัสดุ' : 'อุปกรณ์'}"`,
        `"${item.barcode}"`,
        `"${item.quantity}"`
      ].join(','))
    ];
    
    const csvString = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for Excel UTF-8 BOM
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_barcodes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const itemsToPrint = items.filter(item => selectedIds.has(item.id));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-32">
      {/* Hidden print area */}
      <div id="print-area" className={`${isPrinting ? 'block' : 'hidden'}`}>
        <div className="flex flex-wrap gap-4 justify-center">
          {itemsToPrint.map(item => (
            <div key={item.id} className="p-4 border border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center w-64 text-center break-inside-avoid">
              <div className="font-bold text-sm mb-2">{item.name}</div>
              <Barcode value={item.barcode || '000000'} format="CODE128" width={1.5} height={50} displayValue={true} />
              <div className="text-[10px] text-gray-500 mt-2 font-bold tracking-widest uppercase">ตระการไอที (TAKANIT)</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
          พิมพ์บาร์โค้ด
        </h2>
        <Button3D variant="secondary" size="icon" onClick={() => selectAll()} className="w-10 h-10">
          {selectedIds.size === items.length && items.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5 text-slate-500" />}
        </Button3D>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div 
            key={item.id} 
            className={`flex items-center p-3 rounded-xl border-2 transition-colors cursor-pointer ${selectedIds.has(item.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
            onClick={() => toggleSelection(item.id)}
          >
            <div className="mr-3">
              {selectedIds.has(item.id) ? <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-6 h-6 text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{item.name}</div>
              <div className="font-mono text-xs text-slate-500">{item.barcode}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            ไม่มีรายการสินค้า
          </div>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto flex gap-2">
          <Button3D variant="primary" className="flex-1 h-14" onClick={printSelected}>
            <Printer className="w-5 h-5 mr-2" />
            พิมพ์ ({selectedIds.size})
          </Button3D>
          <Button3D variant="secondary" className="flex-1 h-14" onClick={exportSelected}>
            <Download className="w-5 h-5 mr-2" />
            ส่งออก CSV
          </Button3D>
        </div>
      )}
    </div>
  );
};
