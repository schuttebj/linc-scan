import React, { useState, useEffect } from 'react';
import { MadagascarLicenseDecoder } from '../utils/licenseDecoder';

interface DiagnosticPanelProps {
  onScan: (data: string) => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onScan }) => {
  const [browserInfo, setBrowserInfo] = useState<any>({});
  const [cameraInfo, setCameraInfo] = useState<any>({});
  const decoder = new MadagascarLicenseDecoder();

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

      {/* Enhanced Debugging */}
      <div style={{ marginBottom: '20px' }}>
        <h4>🔍 Enhanced Decoder Debugging</h4>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          These tools help identify exactly where the decoding fails:
        </p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '12px', 
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <button 
            onClick={() => {
              try {
                console.log('🧪 Testing with known working sample...');
                const result = decoder.testWithKnownSample();
                console.log('Known sample result:', result);
                if (result.success) {
                  alert('✅ Known sample test: SUCCESS! Decoder is working correctly.');
                } else {
                  alert(`❌ Known sample test failed: ${result.error}`);
                }
              } catch (err) {
                console.error('Known sample test error:', err);
                alert(`❌ Known sample test error: ${err}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px' }}
          >
            🧪 Test Known Working Sample
          </button>

          <button 
            onClick={() => {
              const testData = "78da4d8db10ac2300c06e0b3a4e80a75b41b8e8a1c38c46a89a12c29c6a826c6b24d";
              console.log('🔍 Running step-by-step debug...');
              const debug = decoder.debugDecoding(testData);
              console.log('Debug results:', debug);
              
              // Show detailed results
              let message = "🔍 STEP-BY-STEP DEBUG RESULTS:\n\n";
              message += `Step 1 (Hex decode): ${debug.step1_success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
              message += `Step 2 (XOR decrypt): ${debug.step2_success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
              message += `  - First byte: ${debug.step2_first_byte} (should be 0x78 for zlib)\n`;
              message += `  - Is zlib header: ${debug.step2_is_zlib_header ? 'YES' : 'NO'}\n`;
              message += `Step 3 (zlib decompress): ${debug.step3_success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
              if (!debug.step3_success) {
                message += `  - Error: ${debug.step3_error}\n`;
              }
              message += `Step 4 (Parse): ${debug.step4_success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
              
              alert(message);
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px' }}
          >
            🔍 Step-by-Step Debug
          </button>

          <button 
            onClick={() => {
              const testData = "78da016f0390fc424a20534348555454457c343536373430323239363234";
              console.log('🧪 Testing WITHOUT XOR encryption...');
              try {
                const result = decoder.decodeBarcodeData(testData, true); // Skip XOR
                console.log('No-XOR result:', result);
                if (result.success) {
                  alert('✅ SUCCESS! Data is NOT XOR encrypted!\n\nYour barcode is just zlib compressed.');
                  onScan(testData); // Show the successful result
                } else {
                  alert(`❌ Still failed without XOR: ${result.error}`);
                }
              } catch (err) {
                console.error('No-XOR test error:', err);
                alert(`❌ No-XOR test error: ${err}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px', background: '#28a745', color: 'white' }}
          >
            🔓 Test Without XOR
          </button>

          <button 
            onClick={() => {
              // Test with the actual scanned binary data
              const testData = "AéDV;©Ê{dbr§gìltJéqrùñtpùôñÙìOtìùÚòóÿssM|îvs\tðñâps¢ò}>évôî\tìuèüìæ§qtìâ}NÞârJsÞò§vjËìá÷J~urájðjJt=8x|âNöÇéÉÒDTssì3G7992E889ÉâA¢1!O>M4;&<IJ+$TQ+n,!/%]ÙÖò+æ{w«}î{íq~nè}bäuÞò[hnl'^P^ìt0=AU<n&_RÉòDO15ËB§G7(9Ì÷9#968DE01D2C8162DD95FA7C08>Ì÷9â)6;CE32C0E;162DD94FB0W2è<!tö+-àxÿ%cªvæ2JCÇðò¤¥ÆïDJ2G69ì3±1zyâÈ<Z¬ûSþäpªw¡ ­|§¢êžx)ÑXªc{(½Úý§ãöþc‚ÿ­¹Ð§\"¾i¤ÅœÂ\\â‰,¤eÝ)í{fD¦6nàÀ¼8øoñ8¿ VLì|xÔƒ‰íàÁUçù¬sï%µ¿påì3*(ëµèëàØLà!¨Ùt°Cà1ìc¥®òbr}ÆüjÞ|>váÔ'*v'î¯Øn3ÀÑË¯£OYnK¨k1+¥(²Œã¼œ$Eì£ÎàÁßn³[š¥`©á¶›ˆ{)BìÀ¡²ÙSò£C—)á¬÷c×o×ì—`g{æ6Â»éë2Ýï¿å !3(L©¬àÕŸ¤ÖzÚ¤y@'âîØº×·Á\t~1`Ä²Sîô‰§S¬P'G.öv‰å‹áäï}D\\›Sì+äÐìú®$ÈõjzýÃŸèøk¨yæêÒ¦°£/í°„=ýÕgâðÂôdR‚tl8èŸhìÞîè\"¦5ƒ½ÞGü³ôV\tQÞ'™Ê4v‰¨{<žDì4ëÿú‚2S¯qý÷øï¬I{åó¡@›ÀúÈ´Ó®Ö+ ×æ_QÊdëä`ÀíàfëlEy_lüìNr\"›Ofáƒêª‡FóQ$ZæJ?öpG~¬°lšá×_ð•~Ž\"ˆOüÏ‰­õìˆ‡+é½¹÷•;ÿÞ6Oæˆo~2%X7&ì%Eú ®u€²ÿ¿{½Ô\\nBCF5ˆ¬ªõÃv¹_[â´áJ iÅ«6©Ÿâ@zGZã¬áRáo§³È8ÜíO4š9¢p }¸í)h'Ÿèæƒì¿à±";
              console.log('🔍 Testing with actual scanned binary data...');
              try {
                const result = decoder.decodeBarcodeData(testData, false); // Try with XOR first
                console.log('Binary data result (with XOR):', result);
                if (result.success) {
                  alert('✅ SUCCESS! Binary data decoded with XOR!');
                  onScan(testData);
                } else {
                  // Try without XOR
                  console.log('🔄 Trying without XOR...');
                  const resultNoXor = decoder.decodeBarcodeData(testData, true);
                  if (resultNoXor.success) {
                    alert('✅ SUCCESS! Binary data decoded WITHOUT XOR!');
                    onScan(testData);
                  } else {
                    alert(`❌ Binary data failed both ways:\nWith XOR: ${result.error}\nWithout XOR: ${resultNoXor.error}`);
                  }
                }
              } catch (err) {
                console.error('Binary data test error:', err);
                alert(`❌ Binary data test error: ${err}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px', background: '#6f42c1', color: 'white' }}
          >
            🔄 Test Binary Data
          </button>

          <button 
            onClick={() => {
              // Decode the current base64 image and show analysis
              const base64Data = "SkZJRnxDfAp8DXwofDEjJXwoOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2N8Wnw8fC98IXwxfCJBUWFSfDI0cXJ8M0J8P3xCQHx9fC58QXxFfDh8WDx8PnxhfCZCfFB8S1FZfFNYfFx8SHxqCXw4IHxNX3xffCV8WXx8Y3xOTz58CTh8bHxSN3wzLCh8bEF8CnwxfHt8PiJ8KyZAPnxcITh6TzddaEVefF12OXwjfF96fFlyfGZgfCh8Jz58XXxiWXxWfD98NnwmfHZQa3xafFx8PixZUUJZcnxxfCJ8ZGUKfFl8QXxDfE85ZkAnfCE4SHwkfD5mO3xlfGl8T3x4fDl2fGI4fFl8ZnxcQ3w9fFJ8QEd8NnxQfGx8KHxefCJkI01ffXxAUUl8QnwsfHF8dnwwZHxbfE8JfD58Rn0nDXw2K3ZhfEl8UnxwTkd8MXwyfDl8K3xqZHwqfGN8XHwjUnxTfC52P2lVfDR8SyR8eV98ZXRUaXxsfHt8RXw8fFpYfEdLfHR8Inw+Znl8Q3x2MXwqRwp8bnxnVXx0XEdAfCJJfDR3fDZ8RnwzfGdiMzp8WHwgdXxJfHI+fGN8VFNhfFl8fXx2fFh4fEF8OXxWfFl8SkV8PHxMKiR8L3h8c298aCQifHR8LVB8Ij58Ry1PfHpGdXxEfGFXfGZG";
              
              try {
                console.log('🔍 Analyzing current image base64...');
                const binaryString = atob(base64Data);
                console.log('📋 Decoded text:', binaryString.substring(0, 100));
                console.log('📊 Decoded length:', binaryString.length);
                
                // Check if it's pipe-separated
                if (binaryString.includes('|')) {
                  const parts = binaryString.split('|');
                  console.log('📝 Pipe-separated parts:', parts.slice(0, 10));
                  console.log('📊 Total parts:', parts.length);
                }
                
                // Show as character codes
                const charCodes = Array.from(binaryString.substring(0, 20)).map(c => c.charCodeAt(0));
                console.log('🔢 First 20 char codes:', charCodes);
                
                alert(`Image Analysis:\nText: ${binaryString.substring(0, 50)}...\nLength: ${binaryString.length}\nSee console for full details`);
              } catch (err) {
                alert(`Error analyzing image: ${err}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px', background: '#dc3545', color: 'white' }}
          >
            🔬 Analyze Image Data
          </button>

          <button 
            onClick={() => {
              // Test the user's actual base64 data
              const userBase64 = "/9j/4AAQSkZJRgABAQEASABIAAAKDSgxIyUoOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2NaPC8hMSJBUWFSMjRxcjs/QkB9LkFFOFg8PmEmQlBLUVlTWFxIagk4IE1fXyVZY05PPgk4bFI3MywobEEKMXs+IismQD5cITh6TzddaEVeXXY5I196WXJmYCgnPl1iWVY/NiZ2UGtaXD4sWVFCWXJxImRlCllBT3lmQCchOEgkPmY7ZWlPeDl2uFlmXEM9UkBHNlBsKF4iZCNNX31AUUlCLHF2DVtPCT5GfScNNit2YUlScE5HMTI5K2pkKmNcI1JTLnY/aVU0SyR5X2V0VGlse0U8WlhHS3QiPmZ5djEqRwpuZ1V0XEdAIkk0dzZGM2diMzpYIHVJcj5jVFNhWX12WHhBOVZZSkU8TCokL3hzb2gkInQtUCI+Ry1PekZ1RGFX///Z";
              
              try {
                console.log('🔍 Analyzing user base64 data...');
                const binaryString = atob(userBase64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                console.log('📊 Total bytes:', bytes.length);
                console.log('🔢 First 20 bytes (hex):', Array.from(bytes.slice(0, 20)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                console.log('🔢 Last 10 bytes (hex):', Array.from(bytes.slice(-10)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
                
                // Check for JPEG signature
                if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
                  console.log('✅ Valid JPEG start signature (FF D8)');
                } else {
                  console.log('❌ Invalid JPEG start signature:', bytes[0].toString(16), bytes[1].toString(16));
                }
                
                // Check for JPEG end signature
                if (bytes[bytes.length-2] === 0xFF && bytes[bytes.length-1] === 0xD9) {
                  console.log('✅ Valid JPEG end signature (FF D9)');
                } else {
                  console.log('❌ Invalid JPEG end signature:', bytes[bytes.length-2].toString(16), bytes[bytes.length-1].toString(16));
                }
                
                // Try to view the image
                const testUri = `data:image/jpeg;base64,${userBase64}`;
                window.open(testUri, '_blank');
                
                alert(`Base64 Analysis Complete!\nBytes: ${bytes.length}\nSee console and new tab for details`);
              } catch (err) {
                console.error('Base64 analysis error:', err);
                alert(`Error analyzing base64: ${err}`);
              }
            }}
            className="btn btn-secondary"
            style={{ fontSize: '12px', margin: '4px', background: '#17a2b8', color: 'white' }}
          >
            🧪 Test User Base64
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