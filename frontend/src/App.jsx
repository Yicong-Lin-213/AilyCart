import React, { useState } from 'react';
import { SCAN_PHASES } from './constants/ScanSteps';
import CameraModule from './components/CameraModule';
import { supabase } from './services/SupabaseClient';

function App() {
  const [phase, setPhase] = useState(SCAN_PHASES.HELLO);
  const [capturedImage, setCapturedImage] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);

  const handleCapture = async (imageBlob, previewDataUrl) => {
    setPhase(SCAN_PHASES.PROCESSING);
    setCapturedImage(previewDataUrl);

    try {
      const fileName = `receipt_${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipt_images')
        .upload(fileName, imageBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipt_images').getPublicUrl(fileName);

      const response = await fetch('/api/v1/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: publicUrl }),
      });

      if (!response.ok) throw new Error('Backend Error');

      const result = await response.json();
      // Parse items and move to Frame 4 after API response
      setScannedItems(result.payload);
      setPhase(SCAN_PHASES.RESULT);
    }

    catch (error) {
      console.error("Upload failed", error);
      alert(`Debug Error: ${error.name} - ${error.message}`);
      setPhase(SCAN_PHASES.SCANNING); // Go back if failed
    }
  };

  return (
    <div className="h-screen w-full bg-white overflow-hidden">
      {phase !== SCAN_PHASES.RESULT ? (
        <CameraModule phase={phase} setPhase={setPhase} onCapture={handleCapture} />
      ) : (
        /* FRAME 4: Result Confirmation */
        <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
          {/* merchant */}
          <div className="text-center pt-4 border-b border-gray-100 pb-4">
            <h2 className="text-h2 font-bold text-text-primary uppercase">
              {scannedItems?.merchant?.name || "Scanned Result"}
            </h2>
            <p className="text-text-secondary text-body-sm">
              {scannedItems?.transaction?.date}
            </p>
          </div>

          {/* goods */}
          <div className="flex-1 overflow-y-auto space-y-6 px-2 custom-scrollbar">
            {scannedItems?.items?.length > 0 ? (
              scannedItems.items.map((item, index) => (
                <div key={index} className="flex items-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* item icon */}
                  <div className="w-16 h-16 flex-shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-text-primary" strokeWidth="3">
                      <path d="M50 85c-15-2-25-15-25-30s10-25 25-35c15 10 25 20 25 35s-10 28-25 30z" />
                      <path d="M50 20v65M35 45l15 10M65 45L50 55" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-body-lg font-bold text-text-primary truncate">{item.name}</h3>
                    <p className="text-text-secondary text-body-sm font-medium">Qty: {item.quantity}</p>
                  </div>

                  <div className="text-body-lg font-bold text-text-primary">
                    ${Number(item.total_price).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary">
                No items detected.
              </div>
            )}
          </div>

          {/* buttons */}
          <div className="pt-4 border-t-2 border-text-primary space-y-6">
            <div className="flex justify-between items-baseline">
              <span className="text-h2 font-bold">TOTAL</span>
              <span className="text-h1 font-bold text-brand-blue">
                ${Number(scannedItems?.totals?.total || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-4 w-full">
              <button
                onClick={() => setPhase(SCAN_PHASES.SCANNING)}
                className="flex-1 py-5 bg-alert-red text-white text-action font-bold rounded-2xl shadow-lg active:translate-y-1 transition-all"
              >
                Retake
              </button>
              <button
                onClick={() => {
                  alert("Items Added to Fridge!");
                  setPhase(SCAN_PHASES.HELLO);
                }}
                className="flex-1 py-5 bg-brand-blue text-white text-action font-bold rounded-2xl shadow-lg active:translate-y-1 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>)}
    </div>
  );
}

export default App;