import React, { useState, useEffect } from 'react';

interface DiagnosticPanelProps {
  onScan: (data: string) => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onScan }) => {
  const [browserInfo, setBrowserInfo] = useState<any>({});
  const [cameraInfo, setCameraInfo] = useState<any>({});

  useEffect(() => {
    // Get browser info
    setBrowserInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
    });

    // Get camera/media info
    const getCameraInfo = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        setCameraInfo({
          totalDevices: devices.length,
          videoDevices: videoDevices.length,
          videoDeviceLabels: videoDevices.map(d => d.label || 'Unknown Camera'),
          hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
          protocol: window.location.protocol,
        });
      } catch (err) {
        setCameraInfo({
          error: err instanceof Error ? err.message : 'Unknown error',
          hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
          protocol: window.location.protocol,
        });
      }
    };

    getCameraInfo();
  }, []);

  // Test data samples
  const testSamples = [
    {
      name: 'Simple Text',
      data: 'Hello World',
      description: 'Basic text to test decoder flow'
    },
    {
      name: 'JSON Sample',
      data: '{"name":"John Doe","id":"123456789"}',
      description: 'JSON-like structure'
    },
    {
      name: 'Sample Hex (Short)',
      data: '48656c6c6f20576f726c64',
      description: 'Hex encoded "Hello World"'
    },
    {
      name: 'Compressed Data Sample',
      data: '78da4d8db10ac2300c06e0b3a4e80a75b41b8e8a1c38c46a89a12c29c6a826c6b24d',
      description: 'Zlib compressed data sample'
    },
    {
      name: 'PDF417 Sample',
      data: '78da016f0390fc424a20534348555454457c343536373430323239363234',
      description: 'Typical PDF417 barcode data'
    }
  ];

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h3>🔧 System Diagnostics</h3>
        <p>Debugging information for scanner issues</p>
      </div>

      {/* Browser Info */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🌐 Browser Information</h4>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Protocol:</strong> {window.location.protocol}</div>
          <div><strong>User Agent:</strong> {browserInfo.userAgent}</div>
          <div><strong>Platform:</strong> {browserInfo.platform}</div>
          <div><strong>Language:</strong> {browserInfo.language}</div>
          <div><strong>Online:</strong> {browserInfo.onLine ? 'Yes' : 'No'}</div>
          <div><strong>Hardware Concurrency:</strong> {browserInfo.hardwareConcurrency}</div>
        </div>
      </div>

      {/* Camera Info */}
      <div style={{ marginBottom: '20px' }}>
        <h4>📹 Camera Information</h4>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {cameraInfo.error ? (
            <div style={{ color: '#dc3545' }}>
              <strong>Error:</strong> {cameraInfo.error}
            </div>
          ) : (
            <>
              <div><strong>Protocol:</strong> {cameraInfo.protocol}</div>
              <div><strong>getUserMedia Available:</strong> {cameraInfo.hasGetUserMedia ? 'Yes' : 'No'}</div>
              <div><strong>Total Devices:</strong> {cameraInfo.totalDevices}</div>
              <div><strong>Video Devices:</strong> {cameraInfo.videoDevices}</div>
              {cameraInfo.videoDeviceLabels && (
                <div><strong>Cameras:</strong> {cameraInfo.videoDeviceLabels.join(', ')}</div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Library Tests */}
      <div style={{ marginBottom: '20px' }}>
        <h4>📚 Library Availability</h4>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <button 
            onClick={async () => {
              try {
                const { BrowserPDF417Reader } = await import('@zxing/library');
                console.log('✅ ZXing PDF417Reader loaded successfully');
                alert('✅ ZXing PDF417Reader: Available');
              } catch (err) {
                console.error('❌ ZXing PDF417Reader failed:', err);
                alert('❌ ZXing PDF417Reader: Failed to load');
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px' }}
          >
            Test ZXing PDF417
          </button>
          
          <button 
            onClick={async () => {
              try {
                const { BrowserMultiFormatReader } = await import('@zxing/library');
                console.log('✅ ZXing MultiFormatReader loaded successfully');
                alert('✅ ZXing MultiFormatReader: Available');
              } catch (err) {
                console.error('❌ ZXing MultiFormatReader failed:', err);
                alert('❌ ZXing MultiFormatReader: Failed to load');
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px' }}
          >
            Test ZXing Multi
          </button>

          <button 
            onClick={async () => {
              try {
                const pako = await import('pako');
                console.log('✅ Pako (zlib) loaded successfully');
                alert('✅ Pako (zlib): Available');
              } catch (err) {
                console.error('❌ Pako failed:', err);
                alert('❌ Pako: Failed to load');
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px' }}
          >
            Test Pako
          </button>
        </div>
      </div>

      {/* Test Data */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🧪 Test Decoder with Sample Data</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          Test the decoder with various data types to isolate scanner vs decoder issues:
        </p>
        
        {testSamples.map((sample, index) => (
          <div key={index} style={{ 
            background: '#f8f9fa', 
            padding: '8px', 
            borderRadius: '6px',
            marginBottom: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <strong>{sample.name}</strong>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {sample.description}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  color: '#495057',
                  wordBreak: 'break-all',
                  marginTop: '4px'
                }}>
                  {sample.data.substring(0, 60)}
                  {sample.data.length > 60 && '...'}
                </div>
              </div>
              <button 
                onClick={() => {
                  console.log(`🧪 Testing decoder with: ${sample.name}`);
                  onScan(sample.data);
                }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div style={{ 
        background: '#e7f3ff', 
        padding: '12px', 
        borderRadius: '8px',
        border: '1px solid #b8daff'
      }}>
        <h4 style={{ color: '#004085' }}>💡 Troubleshooting Steps</h4>
        <ol style={{ fontSize: '14px', color: '#004085', marginLeft: '20px' }}>
          <li>Ensure you're using <strong>HTTPS</strong> (required for camera)</li>
          <li>Test the <strong>🔍 Enhanced Scanner</strong> instead of PDF417-only</li>
          <li>Try the decoder tests above to verify decoding works</li>
          <li>Test with a <strong>simple QR code</strong> first</li>
          <li>Check browser console for detailed error messages</li>
          <li>Try a different browser (Chrome/Safari recommended)</li>
        </ol>
      </div>
    </div>
  );
};