import React, { useRef, useState, useCallback } from 'react';
import { BrowserPDF417Reader, BrowserMultiFormatReader } from '@zxing/library';

interface ImageScannerProps {
  onScan: (data: string) => void;
}

export const ImageScanner: React.FC<ImageScannerProps> = ({ onScan }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setUploadedImage(imageDataUrl);
      setError('');
      setResult('');
      console.log('📸 Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  }, []);

  // Scan the uploaded image
  const scanImage = useCallback(async () => {
    if (!uploadedImage || !canvasRef.current) {
      setError('No image to scan');
      return;
    }

    setIsScanning(true);
    setError('');
    setResult('');
    
    try {
      console.log('🔍 Starting image scan...');

      // Create image element
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = uploadedImage;
      });

      // Draw image to canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      console.log(`📸 Image drawn to canvas: ${img.width}x${img.height}`);

      // Try multiple scanning approaches
      let scanResult = null;

      // Method 1: Try PDF417 reader
      try {
        console.log('🔍 Trying PDF417 reader...');
        const pdf417Reader = new BrowserPDF417Reader();
        scanResult = await pdf417Reader.decodeFromImageElement(img);
        console.log('✅ PDF417 scan successful');
      } catch (pdf417Error) {
        console.log('❌ PDF417 scan failed:', pdf417Error);
        
        // Method 2: Try multi-format reader
        try {
          console.log('🔍 Trying multi-format reader...');
          const multiReader = new BrowserMultiFormatReader();
          scanResult = await multiReader.decodeFromImageElement(img);
          console.log('✅ Multi-format scan successful');
        } catch (multiError) {
          console.log('❌ Multi-format scan failed:', multiError);
          throw new Error('No barcode detected in image');
        }
      }

      if (scanResult && scanResult.getText()) {
        const scannedData = scanResult.getText();
        console.log(`✅ Barcode detected! Data: ${scannedData.substring(0, 50)}...`);
        setResult(scannedData);
        onScan(scannedData);
      } else {
        throw new Error('No barcode data found');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Scan failed';
      console.error('🔍 Image scan error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }, [uploadedImage, onScan]);

  // Clear uploaded image
  const clearImage = useCallback(() => {
    setUploadedImage('');
    setResult('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h2>📸 Image Barcode Scanner</h2>
        <p>Upload a photo of your barcode to scan it</p>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <div className="text-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            style={{ margin: '4px' }}
          >
            📁 Upload Barcode Image
          </button>
          {uploadedImage && (
            <button 
              onClick={clearImage}
              className="btn btn-secondary"
              style={{ margin: '4px' }}
            >
              🗑️ Clear Image
            </button>
          )}
        </div>
      </div>

      {/* Image Preview */}
      {uploadedImage && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            background: '#f8f9fa',
            border: '2px dashed #dee2e6',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <img 
              src={uploadedImage} 
              alt="Uploaded barcode" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px',
                border: '1px solid #dee2e6',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />

      {/* Scan Button */}
      {uploadedImage && (
        <div className="text-center mb-4">
          <button 
            onClick={scanImage}
            disabled={isScanning}
            className="btn btn-primary"
            style={{ fontSize: '16px', padding: '12px 24px' }}
          >
            {isScanning ? '🔍 Scanning...' : '🔍 Scan Barcode'}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error">
          <strong>Scan Error:</strong> {error}
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            <strong>Tips:</strong>
            <ul style={{ textAlign: 'left', marginLeft: '16px', marginTop: '4px' }}>
              <li>Ensure the barcode is clearly visible</li>
              <li>Good lighting and focus in the photo</li>
              <li>Try cropping closer to just the barcode</li>
              <li>Make sure the image isn't blurry</li>
            </ul>
          </div>
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div style={{ 
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '8px',
          padding: '12px',
          margin: '12px 0'
        }}>
          <h4 style={{ color: '#155724', marginBottom: '8px' }}>✅ Barcode Scanned Successfully!</h4>
          <div style={{ 
            fontSize: '12px',
            fontFamily: 'monospace',
            background: '#fff',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #c3e6cb',
            wordBreak: 'break-all',
            maxHeight: '150px',
            overflowY: 'auto'
          }}>
            <strong>Length:</strong> {result.length} characters<br/>
            <strong>Type:</strong> {result.startsWith('http') ? 'URL/QR Code' : 'Data/Barcode'}<br/>
            <strong>Data:</strong><br/>
            {result}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        background: '#e7f3ff',
        border: '1px solid #b8daff',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '14px'
      }}>
        <h4 style={{ color: '#004085' }}>📱 How to Use:</h4>
        <ol style={{ color: '#004085', marginLeft: '20px' }}>
          <li>Take a clear photo of your barcode with your phone</li>
          <li>Click "📁 Upload Barcode Image" and select the photo</li>
          <li>Click "🔍 Scan Barcode" to process it</li>
          <li>The decoded data will appear below</li>
        </ol>
        <p style={{ color: '#004085', marginTop: '8px' }}>
          <strong>💡 Tip:</strong> This works with PDF417, QR codes, and most other barcode formats!
        </p>
      </div>
    </div>
  );
};