import React, { useState, useCallback } from 'react';
import { BarcodeScanner } from './components/BarcodeScanner';
import { AlternativeScanner } from './components/AlternativeScanner';
import { ImageScanner } from './components/ImageScanner';
import { DiagnosticPanel } from './components/DiagnosticPanel';
import { LicenseResults } from './components/LicenseResults';
import { MadagascarLicenseDecoder, DecodedResult } from './utils/licenseDecoder';

type AppState = 'scanning' | 'results' | 'manual' | 'diagnostics';
type ScannerType = 'original' | 'alternative' | 'image';

function App() {
  const [appState, setAppState] = useState<AppState>('scanning');
  const [scannerType, setScannerType] = useState<ScannerType>('image');
  const [isScanning, setIsScanning] = useState(false);
  const [decodedResult, setDecodedResult] = useState<DecodedResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const decoder = new MadagascarLicenseDecoder();

  // Handle barcode scan
  const handleScan = useCallback(async (scannedData: string) => {
    console.log('Scanned data:', scannedData);
    setIsDecoding(true);
    
    try {
      const result = decoder.decodeBarcodeData(scannedData);
      setDecodedResult(result);
      setAppState('results');
    } catch (error) {
      console.error('Decoding failed:', error);
      setDecodedResult({
        success: false,
        license_data: {} as any,
        has_image: false,
        image_size_bytes: 0,
        total_payload_size: 0,
        decoding_format: 'pipe_delimited_xor_encrypted',
        message: 'Failed to decode barcode data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setAppState('results');
    } finally {
      setIsDecoding(false);
      setIsScanning(false);
    }
  }, [decoder]);

  // Handle manual input decode
  const handleManualDecode = useCallback(() => {
    if (!manualInput.trim()) return;
    
    setIsDecoding(true);
    
    try {
      const result = decoder.decodeBarcodeData(manualInput.trim());
      setDecodedResult(result);
      setAppState('results');
    } catch (error) {
      console.error('Manual decoding failed:', error);
      setDecodedResult({
        success: false,
        license_data: {} as any,
        has_image: false,
        image_size_bytes: 0,
        total_payload_size: 0,
        decoding_format: 'pipe_delimited_xor_encrypted',
        message: 'Failed to decode barcode data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setAppState('results');
    } finally {
      setIsDecoding(false);
    }
  }, [manualInput, decoder]);

  // Clear results and return to scanning
  const handleClear = useCallback(() => {
    setDecodedResult(null);
    setManualInput('');
    setAppState('scanning');
  }, []);

  // Loading screen
  if (isDecoding) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            <h3>🔍 Decoding License Data...</h3>
            <p>Please wait while we decrypt and parse the barcode information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>🇲🇬 Madagascar License Scanner</h1>
        <p>Offline PDF417 Barcode Decoder for Driver's Licenses</p>
      </div>

      {/* Results View */}
      {appState === 'results' && decodedResult && (
        <LicenseResults result={decodedResult} onClear={handleClear} />
      )}

      {/* Scanner View */}
      {appState === 'scanning' && (
        <>
          {/* Scanner Type Selection */}
          <div className="card">
            <div className="text-center">
              <h3>📱 Scanner Options</h3>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                {scannerType === 'original' 
                  ? 'Using ZXing PDF417 Reader (may have issues)' 
                  : scannerType === 'alternative'
                  ? 'Using Enhanced Multi-Format Scanner (recommended)'
                  : 'Upload and scan barcode images (best for testing)'}
              </p>
              <div>
                <button 
                  onClick={() => setScannerType('original')}
                  className={`btn ${scannerType === 'original' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ margin: '4px' }}
                >
                  📄 Original PDF417
                </button>
                <button 
                  onClick={() => setScannerType('alternative')}
                  className={`btn ${scannerType === 'alternative' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ margin: '4px' }}
                >
                  🔍 Enhanced Scanner
                </button>
                <button 
                  onClick={() => setScannerType('image')}
                  className={`btn ${scannerType === 'image' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ margin: '4px' }}
                >
                  📸 Image Upload
                </button>
              </div>
            </div>
          </div>

          {/* Render selected scanner */}
          {scannerType === 'original' ? (
            <BarcodeScanner
              onScan={handleScan}
              isScanning={isScanning}
              onScanningChange={setIsScanning}
            />
          ) : scannerType === 'alternative' ? (
            <AlternativeScanner
              onScan={handleScan}
              isScanning={isScanning}
              onScanningChange={setIsScanning}
            />
          ) : (
            <ImageScanner
              onScan={handleScan}
            />
          )}
          
          {/* Mode Toggle */}
          <div className="card">
            <div className="text-center">
              <h3>Alternative Input Methods</h3>
              <button 
                onClick={() => setAppState('manual')}
                className="btn btn-secondary"
                style={{ margin: '4px' }}
              >
                ⌨️ Enter Hex Data Manually
              </button>
              <button 
                onClick={() => setAppState('diagnostics')}
                className="btn btn-secondary"
                style={{ margin: '4px' }}
              >
                🔧 Run Diagnostics
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manual Input View */}
      {appState === 'manual' && (
        <div className="card">
          <div className="text-center mb-4">
            <h2>⌨️ Manual Hex Input</h2>
            <p>Paste the hex-encoded barcode data below</p>
          </div>
          
          <div>
            <label htmlFor="hexInput" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Hex Data:
            </label>
            <textarea
              id="hexInput"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="78da016f0390fc424a20534348555454457c343536373430323239363234..."
              style={{
                width: '100%',
                height: '120px',
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div className="text-center mt-4">
            <button 
              onClick={handleManualDecode}
              disabled={!manualInput.trim()}
              className="btn btn-primary"
            >
              🔍 Decode Data
            </button>
            <button 
              onClick={() => setAppState('scanning')}
              className="btn btn-secondary"
            >
              📷 Back to Scanner
            </button>
          </div>
        </div>
      )}

      {/* Diagnostics View */}
      {appState === 'diagnostics' && (
        <>
          <DiagnosticPanel onScan={handleScan} />
          
          <div className="card">
            <div className="text-center">
              <button 
                onClick={() => setAppState('scanning')}
                className="btn btn-primary"
              >
                📷 Back to Scanner
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="card" style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <div className="text-center">
          <h4>🔐 Security Information</h4>
          <p>
            This app processes data entirely in your browser - no data is sent to any server.
            All decryption and parsing happens locally on your device.
          </p>
          <div style={{ marginTop: '16px' }}>
            <strong>Supported Format:</strong> Standardized Madagascar v5 (9-field pipe-delimited)
            <br />
            <strong>Encryption:</strong> Static Key XOR + zlib compression
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;