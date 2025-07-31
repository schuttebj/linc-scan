import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserPDF417Reader } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  onScanningChange: (scanning: boolean) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  isScanning,
  onScanningChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserPDF417Reader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  // Initialize the PDF417 reader
  useEffect(() => {
    readerRef.current = new BrowserPDF417Reader();
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError('');
      setStatus('Starting camera...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported. Ensure you\'re using HTTPS.');
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatus('Camera ready - Position barcode in viewfinder');
      }
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and refresh.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported. Try using HTTPS or a different browser.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setStatus('');
      console.error('Camera error:', err);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('');
  }, []);

  // Start scanning for barcodes
  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || scanningRef.current) {
      return;
    }

    scanningRef.current = true;
    onScanningChange(true);
    setStatus('Scanning for PDF417 barcode...');

    try {
      const result = await readerRef.current.decodeFromVideoDevice(
        undefined, // Use default device
        videoRef.current
      );
      
      if (result && result.getText()) {
        setStatus('Barcode detected!');
        onScan(result.getText());
        // Stop scanning after successful scan
        stopScanning();
      }
    } catch (err) {
      // This is expected when no barcode is found - keep scanning
      if (scanningRef.current) {
        // Continue scanning if still in scanning mode
        setTimeout(startScanning, 100);
      }
    }
  }, [onScan, onScanningChange]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    scanningRef.current = false;
    onScanningChange(false);
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setStatus('Scanning stopped');
  }, [onScanningChange]);

  // Handle start/stop scanning
  useEffect(() => {
    if (isScanning && !scanningRef.current) {
      startScanning();
    } else if (!isScanning && scanningRef.current) {
      stopScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopScanning();
    };
  }, [stopCamera, stopScanning]);

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h2>📱 PDF417 Barcode Scanner</h2>
        <p>Position the barcode within the viewfinder</p>
      </div>

      {error && (
        <div className="error">
          <strong>Camera Error:</strong> {error}
          
          {error.includes('permission') && (
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              <strong>🔧 Quick Fixes:</strong>
              <ul style={{ textAlign: 'left', marginLeft: '16px', marginTop: '8px' }}>
                <li>Click the 🔒 lock icon in your address bar</li>
                <li>Set Camera to "Allow"</li>
                <li>Refresh this page</li>
                <li>Try in a different browser (Chrome/Safari recommended)</li>
              </ul>
            </div>
          )}
          
          {error.includes('HTTPS') && (
            <div style={{ marginTop: '12px', fontSize: '14px', background: '#fff3cd', padding: '8px', borderRadius: '4px', color: '#856404' }}>
              <strong>⚠️ HTTPS Required:</strong> Camera access requires a secure connection. 
              Deploy to Vercel or use <code>https://localhost:3000</code> for testing.
            </div>
          )}
          
          <div className="mt-4">
            <button 
              onClick={startCamera}
              className="btn btn-secondary"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      )}

      <div className="scanner-container">
        <video
          ref={videoRef}
          className="scanner-video"
          playsInline
          muted
          style={{ display: error ? 'none' : 'block' }}
        />
        
        {!error && (
          <div className="scanner-overlay">
            <div className="scanner-viewfinder">
              <div className="scanner-corners">
                <div className="scanner-corner top-left"></div>
                <div className="scanner-corner top-right"></div>
                <div className="scanner-corner bottom-left"></div>
                <div className="scanner-corner bottom-right"></div>
              </div>
            </div>
            
            {status && (
              <div className="scanner-status">
                {isScanning && <span className="pulse">🔍 </span>}
                {status}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        {!streamRef.current ? (
          <button 
            onClick={startCamera}
            className="btn btn-primary"
          >
            📹 Start Camera
          </button>
        ) : (
          <div>
            <button 
              onClick={isScanning ? stopScanning : startScanning}
              className="btn btn-primary"
              disabled={!!error}
            >
              {isScanning ? '⏹ Stop Scanning' : '🔍 Start Scanning'}
            </button>
            <button 
              onClick={stopCamera}
              className="btn btn-secondary"
            >
              📷 Stop Camera
            </button>
          </div>
        )}
      </div>

      <div className="mt-4" style={{ fontSize: '14px', color: '#666' }}>
        <p><strong>Tips:</strong></p>
        <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
          <li>Ensure good lighting</li>
          <li>Hold device steady</li>
          <li>Position barcode fully within the green frame</li>
          <li>Keep about 6-12 inches from the barcode</li>
        </ul>
      </div>
    </div>
  );
};