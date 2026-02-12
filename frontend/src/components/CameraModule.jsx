import React, { useRef, useEffect, useState } from 'react';
import { SCAN_PHASES } from '../constants/ScanSteps';

const CameraModule = ({ phase, setPhase, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera Error:", err);
      }
    };

    if (phase === SCAN_PHASES.SCANNING) {
      startCamera();
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [phase]);

  // Handle Take Photo
  const handleCaptureClick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Generate preview URL
      const imageData = canvas.toDataURL('image/jpeg');
      setPreviewImage(imageData);
      
      // Move to processing phase
      setPhase(SCAN_PHASES.PROCESSING);

      // Convert to Blob for backend transmission
      canvas.toBlob((blob) => {
        onCapture(blob, imageData); 
      }, 'image/jpeg', 0.8);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-hyperlegible">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* FRAME 1: Welcome Screen */}
      {phase === SCAN_PHASES.HELLO && (
        <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12">
          <h1 className="text-h1 font-bold text-text-primary text-center">Hello, Maggie.<br />Ready to scan?</h1>
          <button 
            onClick={() => {
              setPreviewImage(null);
              setPhase(SCAN_PHASES.SCANNING);
            }} 
            className="flex flex-col items-center gap-6 group">
            <div className="w-36 h-28 bg-brand-blue rounded-[32px] flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 15a5 5 0 100-10 5 5 0 000 10z" /></svg>
            </div>
            <span className="text-body-lg font-bold text-text-primary uppercase">Scan Receipt</span>
          </button>
        </div>
      )}

      {/* FRAMES 2 & 3: Camera / Preview Viewfinder */}
      {(phase === SCAN_PHASES.SCANNING || phase === SCAN_PHASES.PROCESSING) && (
        <>
        <div className="relative flex-[3] p-4 pb-0">
          <div className="relative w-full h-full bg-gray-200 overflow-hidden rounded-[32px] shadow-lg border border-gray-100">
            {/* Show Captured Image if in Processing, otherwise show Video */}
            {phase === SCAN_PHASES.PROCESSING && previewImage ? (
              <img src={previewImage} className="w-full h-full object-cover" alt="Captured receipt" />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            
            {/* Frame 2 Overlay */}
            {phase === SCAN_PHASES.SCANNING && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="w-full h-full border-4 border-dashed border-white/60 rounded-3xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.4)]"></div>
              </div>
            )}

            {/* Frame 3 Overlay: Processing Ring */}
            {phase === SCAN_PHASES.PROCESSING && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-[14px] border-success-green rounded-full opacity-30"></div>
                  <div className="absolute inset-0 border-[14px] border-warning-orange rounded-full border-t-transparent animate-spin"></div>
                </div>
              </div>
            )}
          </div>
        </div>
          
        <div className="flex-[1.2] flex flex-col items-center justify-center p-8 space-y-6 bg-white">
          <p className="text-body-lg font-bold text-text-primary text-center px-4 leading-tight">
            {phase === SCAN_PHASES.SCANNING 
              ? "Holding steady, AilyCart is looking..." 
              : "AilyCart is reading prices for you..."}
          </p>

          <div className="flex flex-row w-full gap-4 max-w-md">
            <button 
              onClick={() => {
                setPreviewImage(null);
                setPhase(SCAN_PHASES.HELLO);
              }}
              className="flex-1 py-5 bg-text-secondary text-white text-body-lg font-bold rounded-2xl shadow-md uppercase">
              {phase === SCAN_PHASES.PROCESSING ? "Cancel" : "Back"}
            </button>

            {phase === SCAN_PHASES.SCANNING && (
              <button onClick={handleCaptureClick} className="flex-[1.5] py-5 bg-brand-blue text-white text-action font-bold rounded-2xl shadow-lg active:scale-95 transition-all uppercase">
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