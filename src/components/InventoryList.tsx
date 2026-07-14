import React, { useState } from 'react';
import { useInventory } from '../store';
import { Button3D } from './ui/3D';
import { Edit2, Package, Search, Printer, Image as ImageIcon, Wrench, Trash2, Download, CheckSquare, Square, FileText } from 'lucide-react';
import { isExpired, cn } from '../lib/utils';
import { InventoryItem } from '../types';
import Barcode from 'react-barcode';

export const InventoryList: React.FC = () => {
  const { items, setView, setEditingItem, deleteItem, userProfile } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'MATERIAL' | 'EQUIPMENT'>('ALL');
  const [showPrintModal, setShowPrintModal] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrintingSelected, setIsPrintingSelected] = useState(false);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.barcode.includes(searchTerm);
    const matchesFilter = filter === 'ALL' || item.category === filter;
    return matchesSearch && matchesFilter;
  });

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
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setView('FORM');
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
      
      if (selectedIds.has(itemToDelete.id)) {
        const newSelection = new Set(selectedIds);
        newSelection.delete(itemToDelete.id);
        setSelectedIds(newSelection);
      }
    }
  };

  const exportCSV = () => {
    const itemsToExport = selectedIds.size > 0 ? items.filter(i => selectedIds.has(i.id)) : filteredItems;
    if (itemsToExport.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    
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
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printSelected = () => {
    if (selectedIds.size === 0) return;
    setIsPrintingSelected(true);
    
    setTimeout(() => {
      const printArea = document.querySelector('#print-area');
      const printContent = printArea ? printArea.innerHTML : '';
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('เบราว์เซอร์ของคุณบล็อคป๊อปอัป กรุณาอนุญาตให้เปิดป๊อปอัปเพื่อพิมพ์ หรือเปิดแอปในแท็บใหม่');
        setIsPrintingSelected(false);
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes (${selectedIds.size} items)</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { padding: 0; }
                .break-inside-avoid { break-inside: avoid; }
              }
            </style>
          </head>
          <body class="p-8">
            ${printContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setIsPrintingSelected(false);
    }, 500);
  };

  const itemsToPrint = items.filter(item => selectedIds.has(item.id));

  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('เบราว์เซอร์ของคุณบล็อคป๊อปอัป กรุณาอนุญาตให้เปิดป๊อปอัปเพื่อพิมพ์ หรือเปิดแอปในแท็บใหม่');
      return;
    }
    
    // Get the SVG element of the barcode
    const barcodeSvg = document.querySelector('#single-print-area svg');
    const svgString = barcodeSvg ? barcodeSvg.outerHTML : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${showPrintModal?.name || ''}</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px; margin: 0; }
            .label { text-align: center; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; max-width: 300px; width: 100%; }
            .name { font-weight: bold; margin-bottom: 10px; font-size: 1.2rem; }
            .shop { font-size: 0.8rem; color: #666; margin-top: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
            @media print {
              @page { margin: 0; }
              body { padding: 0; }
              .label { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${showPrintModal?.name || ''}</div>
            ${svgString}
            <div class="shop">ตระการไอที (TAKANIT)</div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printSummaryReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('เบราว์เซอร์ของคุณบล็อคป๊อปอัป กรุณาอนุญาตให้เปิดป๊อปอัปเพื่อพิมพ์ หรือเปิดแอปในแท็บใหม่');
      return;
    }

    let htmlContent = `
      <html>
        <head>
          <title>รายงานสรุปคลังวัสดุ/อุปกรณ์</title>
          <style>
            body { font-family: 'Sarabun', 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; }
            .date { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .right { text-align: right; }
            .center { text-align: center; }
            .low-stock { color: #dc2626; font-weight: bold; }
            @media print {
              @page { margin: 1.5cm; size: A4 portrait; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>รายงานสรุปคลังวัสดุ/อุปกรณ์</h1>
          <div class="date">ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')}</div>
          <table>
            <thead>
              <tr>
                <th class="center" style="width: 50px;">ลำดับ</th>
                <th class="center" style="width: 60px;">รูปภาพ</th>
                <th>ชื่อรายการ</th>
                <th>บาร์โค้ด</th>
                <th class="center" style="width: 120px;">รูปบาร์โค้ด</th>
                <th>หมวดหมู่</th>
                <th class="right">จำนวนคงเหลือ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
    `;

    filteredItems.forEach((item, index) => {
      const isLowStock = item.quantity <= item.minQuantity;
      const categoryName = item.category === 'MATERIAL' ? 'วัสดุ' : 'อุปกรณ์';
      const status = isLowStock ? '<span class="low-stock">ใกล้หมด</span>' : 'ปกติ';
      const imgHtml = item.imageUrl ? `<img src="${item.imageUrl}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;" />` : '';
      const barcodeImgHtml = `<img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(item.barcode)}&scale=2&height=10" style="max-width: 120px; height: 40px; object-fit: contain;" />`;
      
      htmlContent += `
              <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${imgHtml}</td>
                <td>${item.name}</td>
                <td>${item.barcode}</td>
                <td class="center">${barcodeImgHtml}</td>
                <td>${categoryName}</td>
                <td class="right ${isLowStock ? 'low-stock' : ''}">${item.quantity}</td>
                <td>${status}</td>
              </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 h-full flex flex-col">
      {/* Hidden print area for multiple selection */}
      <div id="print-area" className={`${isPrintingSelected ? 'block' : 'hidden'}`}>
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

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาวัสดุหรือหมายเลขซีเรียล..."
            className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-sm transition-colors text-slate-800 dark:text-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button3D variant="secondary" className="w-12 h-12 flex-shrink-0 !p-0 flex items-center justify-center rounded-full" onClick={selectAll} title="เลือกทั้งหมด">
          {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <CheckSquare className="w-5 h-5 text-slate-400" />}
        </Button3D>
        <Button3D variant="secondary" className="w-12 h-12 flex-shrink-0 !p-0 flex items-center justify-center rounded-full" onClick={exportCSV} title="ส่งออก CSV">
          <Download className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Button3D>
        <Button3D variant="secondary" className="w-12 h-12 flex-shrink-0 !p-0 flex items-center justify-center rounded-full" onClick={printSummaryReport} title="พิมพ์รายงานสรุป">
          <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </Button3D>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button3D 
          variant={filter === 'ALL' ? 'primary' : 'secondary'} 
          size="sm" 
          onClick={() => setFilter('ALL')}
          className="whitespace-nowrap"
        >
          ทั้งหมด
        </Button3D>
        <Button3D 
          variant={filter === 'MATERIAL' ? 'primary' : 'secondary'} 
          size="sm" 
          onClick={() => setFilter('MATERIAL')}
          className="whitespace-nowrap"
        >
          วัสดุ (Material)
        </Button3D>
        <Button3D 
          variant={filter === 'EQUIPMENT' ? 'primary' : 'secondary'} 
          size="sm" 
          onClick={() => setFilter('EQUIPMENT')}
          className="whitespace-nowrap"
        >
          อุปกรณ์ (Equipment)
        </Button3D>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pb-24">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-slate-500 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">ไม่พบข้อมูลที่ค้นหา</div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`bg-white dark:bg-slate-900 rounded-2xl border ${selectedIds.has(item.id) ? 'border-indigo-500 dark:border-indigo-500' : 'border-slate-200 dark:border-slate-800'} shadow-[0_4px_0_rgb(226,232,240)] dark:shadow-[0_4px_0_rgb(15,23,42)] p-4 flex gap-4 items-start transition-colors`}>
              <div className="pt-2 cursor-pointer" onClick={() => toggleSelection(item.id)}>
                {selectedIds.has(item.id) ? <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <Square className="w-6 h-6 text-slate-300 dark:text-slate-700" />}
              </div>
              
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-200 dark:border-slate-700" onClick={() => toggleSelection(item.id)} />
              ) : (
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-inner" onClick={() => toggleSelection(item.id)}>
                  {item.category === 'MATERIAL' ? <span className="text-2xl">📦</span> : <span className="text-2xl">📹</span>}
                </div>
              )}
              
              <div className="flex-1 min-w-0" onClick={() => toggleSelection(item.id)}>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate">{item.name}</h4>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">SN: {item.barcode}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded font-bold uppercase tracking-wider">
                    {item.category === 'MATERIAL' ? 'Material' : 'Equipment'}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded font-mono border",
                    item.quantity <= item.minQuantity 
                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                      : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                  )}>
                    เหลือ {item.quantity}
                  </span>
                  {item.expiryMonth && (
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded border",
                      isExpired(item.expiryMonth)
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50"
                    )}>
                      {item.expiryMonth}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {userProfile?.role === 'admin' && (
                  <Button3D variant="outline" size="icon" className="w-10 h-10 rounded-xl" onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4 text-slate-600 dark:text-indigo-400" />
                  </Button3D>
                )}
                <Button3D variant="secondary" size="icon" className="w-10 h-10 rounded-xl" onClick={() => setShowPrintModal(item)}>
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </Button3D>
                {userProfile?.role === 'admin' && (
                  <Button3D variant="danger" size="icon" className="w-10 h-10 rounded-xl" onClick={() => handleDelete(item)}>
                    <Trash2 className="w-4 h-4 text-red-100" />
                  </Button3D>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto flex gap-2">
          <Button3D variant="primary" className="flex-1 h-14" onClick={printSelected}>
            <Printer className="w-5 h-5 mr-2" />
            พิมพ์ ({selectedIds.size})
          </Button3D>
          <Button3D variant="secondary" className="flex-1 h-14" onClick={exportCSV}>
            <Download className="w-5 h-5 mr-2" />
            ส่งออก CSV
          </Button3D>
        </div>
      )}

      {/* Print Modal for Single Item */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm flex flex-col items-center p-6 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-5 bg-indigo-500 rounded-full"></span>
              พิมพ์บาร์โค้ด
            </h3>
            
            <div id="single-print-area" className="bg-white p-4 rounded-xl border border-slate-200 shadow-inner mb-6 w-full flex flex-col items-center">
              <h4 className="font-bold text-slate-900 mb-2">{showPrintModal.name}</h4>
              <Barcode value={showPrintModal.barcode || '000000'} format="CODE128" />
              <div className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-bold">ตระการไอที (TAKANIT)</div>
            </div>

            <div className="flex gap-3 w-full">
              <Button3D variant="secondary" className="flex-1" onClick={() => setShowPrintModal(null)}>
                ปิด
              </Button3D>
              <Button3D variant="primary" className="flex-1" onClick={printBarcode}>
                พิมพ์ทันที
              </Button3D>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm flex flex-col p-6 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">ยืนยันการลบข้อมูล</h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบ <span className="font-bold text-slate-900 dark:text-white">{itemToDelete.name}</span> ออกจากคลัง? การดำเนินการนี้ไม่สามารถเรียกคืนได้
            </p>

            <div className="flex gap-3 w-full">
              <Button3D variant="secondary" className="flex-1" onClick={() => setItemToDelete(null)}>
                ยกเลิก
              </Button3D>
              <Button3D variant="danger" className="flex-1" onClick={confirmDelete}>
                ยืนยันการลบ
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
