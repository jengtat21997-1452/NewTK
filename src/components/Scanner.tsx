import React, { useEffect, useRef, useState } from 'react';
import { useInventory } from '../store';
import { Html5Qrcode } from 'html5-qrcode';
import { Button3D, Card3D } from './ui/3D';
import { X, Search, Plus, Minus, AlertCircle } from 'lucide-react';
import { isExpired, cn } from '../lib/utils';
import type { InventoryItem } from '../types';

export const Scanner: React.FC = () => {
  const { setView, getItemByBarcode, updateItem, userProfile } = useInventory();
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'CHECK' | 'WITHDRAW'>('CHECK');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  useEffect(() => {
    // Only init scanner if we don't have a scanned result showing
    if (scannedItem || notFoundBarcode) return;

    let isMounted = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const handleScanSuccess = (decodedText: string) => {
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().then(() => {
              const item = getItemByBarcode(decodedText);
              if (item) {
                setScannedItem(item);
              } else {
                setNotFoundBarcode(decodedText);
              }
            }).catch(err => console.error("Error stopping scanner", err));
          }
        };

        // Try environment (rear) camera first
        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            handleScanSuccess,
            () => {} // Handle scan errors quietly
          );
        } catch (err) {
          console.log("Environment camera not found, trying any available camera...", err);
          // Fallback to any available camera
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              let started = false;
              for (const device of devices) {
                try {
                  await html5QrCode.start(
                    device.id,
                    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                    handleScanSuccess,
                    () => {}
                  );
                  started = true;
                  break;
                } catch (e) {
                  console.log(`Failed to start camera ${device.id}`, e);
                }
              }
              if (!started) {
                setCameraError("ไม่สามารถเปิดใช้งานกล้องได้ (Camera could not be started)");
              }
            } else {
              setCameraError("ไม่พบกล้องในอุปกรณ์นี้ (No camera found)");
            }
          } catch (cameraErr: any) {
            console.error("Error getting cameras", cameraErr);
            setCameraError("ไม่สามารถเข้าถึงรายการกล้องได้ กรุณาตรวจสอบสิทธิ์ (Cannot access cameras)");
          }
        }
      } catch (err: any) {
        console.error("Error starting scanner", err);
        setCameraError(err?.message || "ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึง");
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Failed to stop scanner", e));
      }
    };
  }, [scannedItem, notFoundBarcode, getItemByBarcode]);

  const handleAdjustQuantity = (amount: number) => {
    if (scannedItem) {
      const newQuantity = Math.max(0, scannedItem.quantity + amount);
      updateItem(scannedItem.id, { quantity: newQuantity });
      setScannedItem({ ...scannedItem, quantity: newQuantity });
    }
  };

  const handleReset = () => {
    setScannedItem(null);
    setNotFoundBarcode(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="flex items-center justify-between bg-indigo-900/10 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-xl shadow-[0_3px_0_rgb(49,46,129)] dark:shadow-[0_3px_0_rgb(30,27,75)]">
            📲
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white">สแกนมือถือ (Mobile)</h2>
            <p className="text-[10px] text-slate-500 dark:text-indigo-300">กล้องมือถือ / Mobile Camera</p>
          </div>
        </div>
        <Button3D variant="outline" size="sm" onClick={() => setView('DASHBOARD')}>
          <X className="w-4 h-4" />
        </Button3D>
      </div>

      <div className="flex gap-2 mb-4">
        <Button3D 
          variant={scanMode === 'CHECK' ? 'primary' : 'secondary'} 
          className="flex-1"
          onClick={() => { setScanMode('CHECK'); handleReset(); }}
        >
          🔍 ตรวจสอบ
        </Button3D>
        {userProfile?.role === 'admin' && (
          <Button3D 
            variant={scanMode === 'WITHDRAW' ? 'primary' : 'secondary'} 
            className="flex-1"
            onClick={() => { setScanMode('WITHDRAW'); handleReset(); }}
          >
            📤 เบิก-จ่าย
          </Button3D>
        )}
      </div>

      {!scannedItem && !notFoundBarcode && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-indigo-500/50 dark:border-indigo-500/50 overflow-hidden shadow-xl relative">
          <div className="absolute top-4 left-0 right-0 text-center z-10">
            <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
              {scanMode === 'CHECK' ? 'สแกนเพื่อตรวจสอบข้อมูล' : 'สแกนเพื่อรับเข้า/เบิกออก'}
            </span>
          </div>
          <div id="reader" className={`w-full [&_video]:rounded-2xl [&_video]:object-cover ${cameraError ? 'hidden' : ''}`}></div>
          {cameraError && (
            <div className="text-center p-8 pt-16">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-red-500 font-medium">{cameraError}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">อาจเป็นเพราะอุปกรณ์ไม่มีกล้อง หรือไม่ได้อนุญาตให้ใช้กล้อง</p>
            </div>
          )}
        </div>
      )}

      {notFoundBarcode && (
        <Card3D className="text-center space-y-4 py-10 border-amber-500/50">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">ไม่พบสินค้านี้ในระบบ</h3>
          <p className="text-slate-500 dark:text-slate-400 font-mono">SN: {notFoundBarcode}</p>
          <div className="flex justify-center gap-3 pt-4">
            <Button3D variant="secondary" onClick={handleReset}>สแกนใหม่</Button3D>
          </div>
        </Card3D>
      )}

      {scannedItem && (
        <Card3D className="space-y-6">
          <div className="flex gap-4 items-start">
            {scannedItem.imageUrl ? (
              <img src={scannedItem.imageUrl} alt={scannedItem.name} className="w-24 h-24 object-cover rounded-xl shadow-md border border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-700">
                {scannedItem.category === 'MATERIAL' ? <span className="text-4xl">📦</span> : <span className="text-4xl">📹</span>}
              </div>
            )}
            <div className="flex-1">
              <span className="inline-block text-[10px] px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded font-bold uppercase tracking-wider mb-2">
                {scannedItem.category === 'MATERIAL' ? 'Material' : 'Equipment'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{scannedItem.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">SN: {scannedItem.barcode}</p>
            </div>
          </div>

          {scannedItem.expiryMonth && (
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-3 font-bold",
              isExpired(scannedItem.expiryMonth) 
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-400"
            )}>
              <AlertCircle className="w-6 h-6" />
              <div>
                <div className="text-[10px] uppercase opacity-80 tracking-wider">ตรวจสอบ / หมดอายุ</div>
                <div className="text-sm">{scannedItem.expiryMonth} {isExpired(scannedItem.expiryMonth) && '(เกินกำหนด)'}</div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="text-center mb-5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">จำนวนคงเหลือ</span>
              <div className="text-5xl font-black mt-2 text-slate-900 dark:text-white font-mono">{scannedItem.quantity}</div>
            </div>
            
            {scanMode === 'WITHDRAW' && (
              <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button className="w-10 h-10 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold" onClick={() => setWithdrawAmount(Math.max(1, withdrawAmount - 1))}>
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="font-bold text-2xl font-mono">{withdrawAmount}</div>
                  <button className="w-10 h-10 flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold" onClick={() => setWithdrawAmount(withdrawAmount + 1)}>
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button3D variant="danger" className="flex-1" onClick={() => handleAdjustQuantity(-withdrawAmount)}>
                    <Minus className="w-4 h-4 mr-2" /> เบิกออก
                  </Button3D>
                  <Button3D variant="success" className="flex-1" onClick={() => handleAdjustQuantity(withdrawAmount)}>
                    <Plus className="w-4 h-4 mr-2" /> รับเข้า
                  </Button3D>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button3D variant="primary" className="w-full py-4 text-lg" onClick={handleReset}>
              สแกนสินค้าอื่น
            </Button3D>
          </div>
        </Card3D>
      )}
    </div>
  );
};
