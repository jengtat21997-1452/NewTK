import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '../store';
import { Button3D, Card3D } from './ui/3D';
import { ArrowLeft, Camera, ImagePlus, Save, Trash2, Printer, Check, X } from 'lucide-react';
import { generateAutoBarcode } from '../lib/utils';
import { InventoryItem, ItemCategory } from '../types';
import Barcode from 'react-barcode';

export const ItemForm: React.FC = () => {
  const { addItem, updateItem, deleteItem, editingItem, setView } = useInventory();
  
  const [name, setName] = useState(editingItem?.name || '');
  const [barcode, setBarcode] = useState(editingItem?.barcode || '');
  const [category, setCategory] = useState<ItemCategory>(editingItem?.category || 'MATERIAL');
  const [quantity, setQuantity] = useState(editingItem?.quantity?.toString() || '0');
  const [minQuantity, setMinQuantity] = useState(editingItem?.minQuantity?.toString() || '5');
  const [checkInterval, setCheckInterval] = useState<string>(editingItem?.checkInterval?.toString() || '');
  const [expiryMonth, setExpiryMonth] = useState(editingItem?.expiryMonth || '');
  const [imageUrl, setImageUrl] = useState(editingItem?.imageUrl || '');
  const [isPredicting, setIsPredicting] = useState(false);
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-generate barcode if new item and barcode is empty
    if (!editingItem && !barcode) {
      setBarcode(generateAutoBarcode());
    }
  }, []);

  const predictItemName = async (base64Image: string) => {
    try {
      setIsPredicting(true);
      const res = await fetch('/api/predict-item-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name && data.name !== "ไม่ทราบชื่อ" && data.name !== "") {
          setName(data.name);
        }
      }
    } catch (e) {
      console.error("Failed to predict item name", e);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(dataUrl);
          
          if (!editingItem || !name) {
             predictItemName(dataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!name || !barcode) return alert('กรุณากรอกชื่อและบาร์โค้ด');

    let finalExpiryMonth = expiryMonth;
    if (checkInterval !== '') {
      const today = new Date();
      today.setMonth(today.getMonth() + Number(checkInterval));
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      finalExpiryMonth = `${year}-${month}`;
    } else {
      finalExpiryMonth = '';
    }

    const itemData = {
      name,
      barcode,
      category,
      quantity: parseInt(quantity, 10) || 0,
      minQuantity: parseInt(minQuantity, 10) || 0,
      expiryMonth: finalExpiryMonth || undefined,
      checkInterval: checkInterval !== '' ? Number(checkInterval) : undefined,
      imageUrl,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData);
      }
      setView('LIST');
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    if (editingItem) {
      try {
        await deleteItem(editingItem.id);
        setView('LIST');
      } catch (e) {
        console.error(e);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const cancelDelete = () => setIsDeleting(false);

  const printBarcode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const barcodeSvg = document.querySelector('.barcode-preview-area svg');
    const svgString = barcodeSvg ? barcodeSvg.outerHTML : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .label { text-align: center; margin-bottom: 20px; border: 1px dashed #ccc; padding: 20px; }
            .name { font-weight: bold; margin-bottom: 10px; font-size: 1.2rem; }
            .shop { font-size: 0.8rem; color: #666; margin-top: 5px; }
            @media print { @page { margin: 0; } body { padding: 0; } .label { border: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${name}</div>
            ${svgString}
            <div class="shop">ร้านตระการไอที (TAKANIT)</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors text-slate-900 dark:text-white";
  const labelClasses = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Button3D variant="outline" size="icon" onClick={() => setView('LIST')} className="w-10 h-10">
            <ArrowLeft className="w-4 h-4" />
          </Button3D>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-5 bg-indigo-500 rounded-full"></span>
            {editingItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
          </h2>
        </div>
        {editingItem && (
          isDeleting ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500 font-bold mr-2">ลบแน่ใจไหม?</span>
              <Button3D variant="danger" size="icon" className="w-10 h-10" onClick={confirmDelete}>
                <Check className="w-4 h-4" />
              </Button3D>
              <Button3D variant="secondary" size="icon" className="w-10 h-10" onClick={cancelDelete}>
                <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </Button3D>
            </div>
          ) : (
            <Button3D variant="danger" size="icon" className="w-10 h-10" onClick={handleDeleteClick}>
              <Trash2 className="w-4 h-4" />
            </Button3D>
          )
        )}
      </div>

      <Card3D className="space-y-6">
        {/* Image Upload Area */}
        <div className="flex justify-center">
          <div 
            className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-800/50"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <span className="text-3xl mb-2">📷</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">แนบรูป</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>
        {imageUrl && (
           <div className="text-center">
              <Button3D variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setImageUrl(''); }}>
                ลบรูปภาพ
              </Button3D>
           </div>
        )}

        <div className="space-y-5">
          <div className="relative">
            <label className={labelClasses}>ชื่อวัสดุ/อุปกรณ์ <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClasses} ${isPredicting ? 'pr-10' : ''}`}
                placeholder="เช่น กล้อง Hikvision 2MP"
              />
              {isPredicting && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClasses}>หมวดหมู่</label>
            <div className="flex gap-2">
              <Button3D 
                variant={category === 'MATERIAL' ? 'primary' : 'secondary'} 
                className="flex-1"
                onClick={() => setCategory('MATERIAL')}
              >
                📦 วัสดุ (Material)
              </Button3D>
              <Button3D 
                variant={category === 'EQUIPMENT' ? 'primary' : 'secondary'} 
                className="flex-1"
                onClick={() => setCategory('EQUIPMENT')}
              >
                📹 อุปกรณ์ (Equipment)
              </Button3D>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
              <span>บาร์โค้ด / Serial Number <span className="text-red-500">*</span></span>
              <span className="text-indigo-600 dark:text-indigo-400 cursor-pointer" onClick={() => setBarcode(generateAutoBarcode())}>สุ่มอัตโนมัติ</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className={`${inputClasses} font-mono`}
              />
              <Button3D variant="secondary" size="icon" onClick={() => setShowPrintModal(true)}>
                <Printer className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </Button3D>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>จำนวนคงเหลือ</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${inputClasses} text-lg font-mono font-bold`}
              />
            </div>
            <div>
              <label className={labelClasses}>แจ้งเตือนเมื่อต่ำกว่า</label>
              <input
                type="number"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                className={`${inputClasses} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>กำหนดการตรวจสอบ</label>
            <select
              value={checkInterval}
              onChange={(e) => setCheckInterval(e.target.value)}
              className={inputClasses}
            >
              <option value="">ไม่มีกำหนดตรวจสอบ</option>
              <option value="1">ทุก 1 เดือน</option>
              <option value="3">ทุก 3 เดือน</option>
              <option value="6">ทุก 6 เดือน</option>
            </select>
            {checkInterval !== '' && expiryMonth && editingItem && (
              <p className="text-[10px] text-slate-500 mt-2">
                * วันที่ตรวจสอบครั้งถัดไปจะถูกคำนวณใหม่เมื่อบันทึก (เดิม: {expiryMonth})
              </p>
            )}
            {checkInterval === '' && (
              <p className="text-[10px] text-slate-500 mt-2">* จะไม่มีการแจ้งเตือนตรวจสอบสำหรับรายการนี้</p>
            )}
          </div>
        </div>
      </Card3D>

      <Button3D variant="primary" className="w-full h-14 text-lg rounded-2xl" onClick={handleSave}>
        <Save className="w-5 h-5 mr-2" />
        บันทึกข้อมูลเข้าระบบ
      </Button3D>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-sm flex flex-col items-center p-6 text-slate-900 dark:text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-5 bg-indigo-500 rounded-full"></span>
              พิมพ์บาร์โค้ดด่วน
            </h3>
            <div className="barcode-preview-area bg-white p-4 rounded-xl border border-slate-200 shadow-inner mb-6 w-full flex justify-center">
              <Barcode value={barcode || '000000'} format="CODE128" />
            </div>
            <div className="flex gap-3 w-full">
              <Button3D variant="secondary" className="flex-1" onClick={() => setShowPrintModal(false)}>
                ยกเลิก
              </Button3D>
              <Button3D variant="primary" className="flex-1" onClick={printBarcode}>
                <Printer className="w-5 h-5 mr-2" /> พิมพ์
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
