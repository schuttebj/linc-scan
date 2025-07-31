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
  const [scanAttempts, setScanAttempts] = useState<number>(0);

  // Initialize the PDF417 reader
  useEffect(() => {
    readerRef.current = new BrowserPDF417Reader();
    console.log('📱 Scanner: PDF417 reader initialized');
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
        console.log('📱 Scanner: PDF417 reader reset');
      }
    };
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError('');
      setStatus('Starting camera...');
      console.log('📱 Scanner: Attempting to start camera...');
      
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

      console.log('📱 Scanner: Requesting camera access with constraints');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log('📱 Scanner: Camera stream obtained successfully');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('Camera ready - Position barcode in viewfinder');
        console.log('📱 Scanner: Video element playing, camera ready');
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
      console.error('📱 Scanner: Camera error:', errorMessage, err);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    console.log('📱 Scanner: Stopping camera stream...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('');
    console.log('📱 Scanner: Camera stopped');
  }, []);

  // Start scanning for barcodes
  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || scanningRef.current) {
      console.log('📱 Scanner: Cannot start scanning - missing requirements');
      return;
    }

    scanningRef.current = true;
    onScanningChange(true);
    setStatus('🔍 Scanning for PDF417 barcode...');
    setScanAttempts(0);
    console.log('📱 Scanner: Starting PDF417 scanning loop');

    const scanLoop = async () => {
      if (!scanningRef.current) {
        console.log('📱 Scanner: Scanning stopped by user');
        return;
      }

      setScanAttempts(prev => {
        const newCount = prev + 1;
        if (newCount % 20 === 0) { // Log every 20 attempts to avoid spam
          console.log(`📱 Scanner: Still scanning... (attempt ${newCount})`);
        }
        return newCount;
      });
      
      try {
        const result = await readerRef.current!.decodeFromVideoDevice(
          undefined, // Use default device
          videoRef.current!
        );
        
        if (result && result.getText()) {
          const scannedData = result.getText();
          console.log(`📱 Scanner: ✅ Barcode detected! Length: ${scannedData.length} chars`);
          console.log(`📱 Scanner: Data preview: ${scannedData.substring(0, 50)}...`);
          setStatus('✅ Barcode detected! Decoding...');
          onScan(scannedData);
          stopScanning();
          return;
        }
      } catch (err) {
        // This is expected when no barcode is found - continue scanning
        if (scanningRef.current) {
          setTimeout(scanLoop, 200);
        }
      }
    };

    scanLoop();
  }, [onScan, onScanningChange]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('📱 Scanner: Stopping scanning...');
    scanningRef.current = false;
    onScanningChange(false);
    setScanAttempts(0);
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setStatus('Scanning stopped');
    console.log('📱 Scanner: Scanning stopped, reader reset');
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
                {scanAttempts > 0 && <span style={{ marginLeft: '8px', fontSize: '12px' }}>({scanAttempts} attempts)</span>}
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

      {/* Test Decoder Button */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            // Test with sample data to verify decoder works
            const testData = "78da4d8db10ac2300c06e0b3a4e80a75b41b8e8a1c38c46a89a12c29c6a826c6b24d";
            console.log('📱 Scanner: Testing decoder with sample data...');
            onScan(testData);
          }}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          🧪 Test Decoder
        </button>
      </div>

      <div className="mt-4" style={{ fontSize: '14px', color: '#666' }}>
        <p><strong>Tips:</strong></p>
        <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
          <li>Ensure good lighting</li>
          <li>Hold device steady</li>
          <li>Position barcode fully within the green frame</li>
          <li>Keep about 6-12 inches from the barcode</li>
          <li>Try different angles if not detecting</li>
          <li>Check the debug log above for scanning activity</li>
        </ul>
      </div>
    </div>
  );
};