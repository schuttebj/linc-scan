import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AlternativeScannerProps {
  onScan: (data: string) => void;
  isScanning: boolean;
  onScanningChange: (scanning: boolean) => void;
}

export const AlternativeScanner: React.FC<AlternativeScannerProps> = ({
  onScan,
  isScanning,
  onScanningChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState<number>(0);
  const [rawData, setRawData] = useState<string>('');

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError('');
      setStatus('Starting camera...');
      console.log('🔍 Alternative Scanner: Starting camera...');
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('Camera ready - Try with ANY barcode first');
        console.log('🔍 Alternative Scanner: Camera ready');
      }
    } catch (err) {
      setError('Camera failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error('🔍 Alternative Scanner: Camera error:', err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('');
    console.log('🔍 Alternative Scanner: Camera stopped');
  }, []);

  // Manual frame capture for analysis
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    // Draw current frame
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(`🔍 Frame captured: ${canvas.width}x${canvas.height}`);
    
    return imageData;
  }, []);

  // Try ZXing with different approach
  const scanWithZXing = useCallback(async () => {
    try {
      // Dynamic import to avoid build issues
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const reader = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        const result = await reader.decodeFromVideoDevice(undefined, videoRef.current);
        if (result) {
          console.log('🔍 ZXing result:', result.getText());
          return result.getText();
        }
      }
    } catch (err) {
      console.log('🔍 ZXing scan failed:', err);
    }
    return null;
  }, []);

  // Start scanning with multiple approaches
  const startScanning = useCallback(async () => {
    if (!videoRef.current || scanningRef.current) {
      console.log('🔍 Cannot start scanning - requirements not met');
      return;
    }

    scanningRef.current = true;
    onScanningChange(true);
    setStatus('🔍 Scanning with multiple methods...');
    setScanAttempts(0);
    console.log('🔍 Starting multi-method scanning');

    const scanLoop = async () => {
      if (!scanningRef.current) return;

      setScanAttempts(prev => prev + 1);

      try {
        // Method 1: Try ZXing Multi-Format Reader (supports more formats)
        const zxingResult = await scanWithZXing();
        if (zxingResult) {
          console.log('🔍 ✅ Barcode found with ZXing!', zxingResult);
          setStatus('✅ Barcode detected!');
          setRawData(zxingResult); // Store raw data for display
          onScan(zxingResult);
          stopScanning();
          return;
        }

        // Method 2: Frame capture for manual analysis
        if (scanAttempts % 10 === 0) {
          captureFrame(); // Capture frame for debugging
        }

        // Continue scanning
        if (scanningRef.current) {
          setTimeout(scanLoop, 100);
        }
      } catch (err) {
        console.error('🔍 Scan error:', err);
        if (scanningRef.current) {
          setTimeout(scanLoop, 200);
        }
      }
    };

    scanLoop();
  }, [scanWithZXing, captureFrame, onScan, onScanningChange, scanAttempts]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    console.log('🔍 Stopping scanning...');
    scanningRef.current = false;
    onScanningChange(false);
    setScanAttempts(0);
    setStatus('Scanning stopped');
  }, [onScanningChange]);

  // Handle scanning state changes
  useEffect(() => {
    if (isScanning && !scanningRef.current) {
      startScanning();
    } else if (!isScanning && scanningRef.current) {
      stopScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      stopScanning();
    };
  }, [stopCamera, stopScanning]);

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h2>🔍 Alternative Barcode Scanner</h2>
        <p>Multi-method approach for better detection</p>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
          <div className="mt-4">
            <button onClick={startCamera} className="btn btn-secondary">
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
        
        {/* Hidden canvas for frame capture */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
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
            

          </div>
        )}
      </div>

      {/* Status Display (outside video to prevent jumping) */}
      {status && (
        <div style={{ 
          textAlign: 'center', 
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          margin: '12px 0',
          border: '1px solid #dee2e6'
        }}>
          <div style={{ fontWeight: 'bold', color: status.includes('✅') ? '#28a745' : '#666' }}>
            {isScanning && <span className="pulse">🔍 </span>}
            {status}
          </div>
          {scanAttempts > 0 && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Scan attempts: {scanAttempts}
            </div>
          )}
        </div>
      )}

      {/* Raw Data Display */}
      {rawData && (
        <div style={{ 
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          borderRadius: '8px',
          padding: '12px',
          margin: '12px 0'
        }}>
          <h4 style={{ color: '#004085', marginBottom: '8px' }}>📊 Raw Barcode Data Detected</h4>
          <div style={{ 
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#fff',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #b8daff',
            wordBreak: 'break-all',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <strong>Length:</strong> {rawData.length} characters<br/>
            <strong>Type:</strong> {rawData.startsWith('http') ? 'URL/QR Code' : 'Data/Barcode'}<br/>
            <strong>Data:</strong><br/>
            {rawData}
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button 
              onClick={() => setRawData('')}
              style={{ 
                background: '#004085', 
                color: 'white', 
                border: 'none', 
                padding: '4px 8px', 
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        {!streamRef.current ? (
          <button onClick={startCamera} className="btn btn-primary">
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
            <button onClick={stopCamera} className="btn btn-secondary">
              📷 Stop Camera
            </button>
          </div>
        )}
      </div>

      {/* Manual tests */}
      <div className="mt-4 text-center">
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
          <strong>Quick Tests:</strong>
        </div>
        <button 
          onClick={() => {
            console.log('🔍 Testing with QR code data...');
            onScan('https://example.com'); // Simple QR code data
          }}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px', margin: '4px' }}
        >
          📱 Test QR
        </button>
        <button 
          onClick={() => {
            console.log('🔍 Testing with sample hex...');
            onScan('78da4d8db10ac2300c06e0b3a4e80a75b41b8e8a1c38c46a89a12c29c6a826c6b24d');
          }}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px', margin: '4px' }}
        >
          🧪 Test Decoder
        </button>
      </div>

      <div className="mt-4" style={{ fontSize: '14px', color: '#666' }}>
        <p><strong>This scanner tries:</strong></p>
        <ul style={{ textAlign: 'left', marginLeft: '20px' }}>
          <li>🔍 ZXing multi-format reader (QR, DataMatrix, PDF417)</li>
          <li>📸 Higher resolution camera (1920x1080)</li>
          <li>🎯 Frame capture for analysis</li>
          <li>⚡ Faster scanning intervals</li>
        </ul>
        <p style={{ marginTop: '8px' }}>
          <strong>💡 Try:</strong> First test with a simple QR code to verify scanning works, 
          then try your PDF417 barcode.
        </p>
      </div>
    </div>
  );
};