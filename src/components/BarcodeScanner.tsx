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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [scanAttempts, setScanAttempts] = useState<number>(0);

  // Debug logging function
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('📱 Scanner:', logEntry);
    setDebugLog(prev => [...prev.slice(-9), logEntry]); // Keep last 10 entries
  }, []);

  // Initialize the PDF417 reader
  useEffect(() => {
    readerRef.current = new BrowserPDF417Reader();
    addDebugLog('PDF417 reader initialized');
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
        addDebugLog('PDF417 reader reset');
      }
    };
  }, [addDebugLog]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError('');
      setStatus('Starting camera...');
      addDebugLog('Attempting to start camera...');
      
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

      addDebugLog('Requesting camera access with constraints');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      addDebugLog('Camera stream obtained successfully');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('Camera ready - Position barcode in viewfinder');
        addDebugLog('Video element playing, camera ready');
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
      addDebugLog(`Camera error: ${errorMessage}`);
      console.error('Camera error:', err);
    }
  }, [addDebugLog]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    addDebugLog('Stopping camera stream...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('');
    addDebugLog('Camera stopped');
  }, [addDebugLog]);

  // Start scanning for barcodes
  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || scanningRef.current) {
      addDebugLog('Cannot start scanning - missing requirements');
      return;
    }

    scanningRef.current = true;
    onScanningChange(true);
    setStatus('🔍 Scanning for PDF417 barcode...');
    addDebugLog('Starting PDF417 scanning loop');

    const scanLoop = async () => {
      if (!scanningRef.current) {
        addDebugLog('Scanning stopped by user');
        return;
      }

      setScanAttempts(prev => prev + 1);
      
      try {
        addDebugLog(`Scan attempt #${scanAttempts + 1}`);
        
        const result = await readerRef.current!.decodeFromVideoDevice(
          undefined, // Use default device
          videoRef.current!
        );
        
        if (result && result.getText()) {
          const scannedData = result.getText();
          addDebugLog(`✅ Barcode detected! Length: ${scannedData.length} chars`);
          addDebugLog(`Data preview: ${scannedData.substring(0, 50)}...`);
          setStatus('✅ Barcode detected! Decoding...');
          onScan(scannedData);
          stopScanning();
          return;
        }
      } catch (err) {
        // This is expected when no barcode is found
        if (scanAttempts % 20 === 0) { // Log every 20 attempts to avoid spam
          addDebugLog(`Still scanning... (attempt ${scanAttempts + 1})`);
        }
        
        if (scanningRef.current) {
          // Continue scanning
          setTimeout(scanLoop, 200); // Slightly slower for better performance
        }
      }
    };

    scanLoop();
  }, [onScan, onScanningChange, addDebugLog, scanAttempts]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    addDebugLog('Stopping scanning...');
    scanningRef.current = false;
    onScanningChange(false);
    setScanAttempts(0);
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setStatus('Scanning stopped');
    addDebugLog('Scanning stopped, reader reset');
  }, [onScanningChange, addDebugLog]);

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

      {/* Debug Panel */}
      {debugLog.length > 0 && (
        <div className="mt-4" style={{ 
          background: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '8px', 
          padding: '12px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <strong>📊 Debug Log</strong>
            <button 
              onClick={() => setDebugLog([])}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#666', 
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            background: '#fff',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            {debugLog.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px', color: '#495057' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Decoder Button */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            // Test with sample data to verify decoder works
            const testData = "78da4d8db10ac2300c06e0b3a4e80a75b41b8e8a1c38c46a89a12c29c6a826c6b24d";
            addDebugLog('Testing decoder with sample data...');
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