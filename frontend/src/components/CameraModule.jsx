import React, { useRef, useEffect } from 'react';
import { SCAN_PHASES } from '../constants/ScanSteps';

/**
 * CameraModule handles Frame 1 (Hello), Frame 2 (Scanning), and Frame 3 (Processing).
 * Design specs: Atkinson Hyperlegible font, Brand Blue (#1565C0), and high-contrast UI.
 */
const CameraModule = ({ phase, setPhase, onCapture }) => {
  const videoRef = useRef(null);

  // Initialize camera only during the SCANNING phase
  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        alert("Please enable camera permissions to scan receipts.");
      }
    };

    if (phase === SCAN_PHASES.SCANNING) {
      startCamera();
    }

    // Cleanup camera stream when component unmounts or phase changes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [phase]);

  return (
    <div className="flex flex-col h-full bg-white font-hyperlegible">
      
      {/* FRAME 1: Hello Maggie (Welcome State) */}
      {phase === SCAN_PHASES.HELLO && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12">
          <h1 className="text-h1 font-bold text-text-primary text-center leading-tight">
            Hello, Maggie.<br />Ready to scan?
          </h1>
          
          <button 
            onClick={() => setPhase(SCAN_PHASES.SCANNING)}
            className="flex flex-col items-center gap-6 group transition-all"
          >
            <div className="w-36 h-28 bg-brand-blue rounded-[32px] flex items-center justify-center shadow-lg active:scale-90 active:shadow-none transition-all">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 15a5 5 0 100-10 5 5 0 000 10z" />
              </svg>
            </div>
            <span className="text-body-lg font-bold text-text-primary uppercase tracking-wide">
              Scan Receipt
            </span>
          </button>
        </div>
      )}

      {/* FRAME 2 (Scanning) & FRAME 3 (Processing) */}
      {(phase === SCAN_PHASES.SCANNING || phase === SCAN_PHASES.PROCESSING) && (
        <>
          {/* Top Section: Viewfinder area (3/4 of the height) */}
          <div className="relative flex-[3] bg-gray-200 overflow-hidden rounded-b-[40px] shadow-2xl">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover" 
            />
            
            {/* Frame 2: Dashed Scanning Overlay */}
            {phase === SCAN_PHASES.SCANNING && (
              <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
                <div className="w-full h-full border-4 border-dashed border-white/60 rounded-3xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.4)]"></div>
              </div>
            )}

            {/* Frame 3: Tri-color Processing Ring */}
            {phase === SCAN_PHASES.PROCESSING && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="relative w-48 h-48">
                  {/* Outer Success Green Ring (Static) */}
                  <div className="absolute inset-0 border-[14px] border-success-green rounded-full opacity-30"></div>
                  {/* Spinning Warning Orange Accent */}
                  <div className="absolute inset-0 border-[14px] border-warning-orange rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Section: Controls & Text*/}
          <div className="flex-[1.2] flex flex-col items-center justify-center p-8 space-y-6 bg-white">
            <p className="text-body-lg font-bold text-text-primary text-center px-4">
              {phase === SCAN_PHASES.SCANNING 
                ? "Holding steady, AilyCart is looking..." 
                : "AilyCart is reading prices for you..."}
            </p>

            {/* Row-based Action Buttons Group */}
            <div className="flex flex-row w-full gap-4 max-w-md">
              {/* Back / Cancel Button (Secondary) */}
              <button 
                onClick={() => setPhase(SCAN_PHASES.HELLO)} 
                className="flex-1 py-5 bg-text-secondary text-white text-body-lg font-bold rounded-2xl shadow-md active:scale-95 transition-all uppercase"
              >
                {phase === SCAN_PHASES.PROCESSING ? "Cancel" : "Back"}
              </button>

              {/* Capture Button (Primary) - Only visible in Scanning Phase */}
              {phase === SCAN_PHASES.SCANNING && (
                <button 
                  onClick={onCapture} 
                  className="flex-[1.5] py-5 bg-brand-blue text-white text-action font-bold rounded-2xl shadow-lg active:scale-95 active:shadow-none transition-all uppercase"
                >
                  Capture
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraModule;