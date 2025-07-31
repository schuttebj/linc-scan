import React from 'react';
import { DecodedResult } from '../utils/licenseDecoder';

interface LicenseResultsProps {
  result: DecodedResult;
  onClear: () => void;
}

export const LicenseResults: React.FC<LicenseResultsProps> = ({ result, onClear }) => {
  if (!result.success) {
    return (
      <div className="card">
        <div className="error">
          <h3>❌ Decoding Failed</h3>
          <p>{result.error || 'Unknown error occurred'}</p>
          <div className="mt-4">
            <button onClick={onClear} className="btn btn-secondary">
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { license_data } = result;

  return (
    <div className="card">
      <div className="text-center mb-4">
        <h2>✅ License Decoded Successfully</h2>
        <p className="success">{result.message}</p>
      </div>

      <div className="results-grid">
        <div className="license-info">
          {/* Personal Information */}
          <div className="license-section">
            <h3>👤 Personal Information</h3>
            <div className="license-field">
              <label>Name:</label>
              <span>{license_data.person_name || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>ID Number:</label>
              <span>{license_data.id_number || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Sex:</label>
              <span>{license_data.sex || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Date of Birth:</label>
              <span>{license_data.date_of_birth || 'N/A'}</span>
            </div>
          </div>

          {/* License Information */}
          <div className="license-section">
            <h3>🪪 License Information</h3>
            <div className="license-field">
              <label>License Number:</label>
              <span>{license_data.license_number || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>License Codes:</label>
              <span>{license_data.license_codes?.join(', ') || 'None'}</span>
            </div>
            <div className="license-field">
              <label>Valid From:</label>
              <span>{license_data.valid_from || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Valid Until:</label>
              <span>{license_data.valid_to || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Vehicle Restrictions:</label>
              <span>{license_data.vehicle_restrictions?.join(', ') || 'None'}</span>
            </div>
            <div className="license-field">
              <label>Driver Restrictions:</label>
              <span>{license_data.driver_restrictions?.join(', ') || 'None'}</span>
            </div>
          </div>

          {/* Technical Information */}
          <div className="license-section">
            <h3>🔧 Technical Information</h3>
            <div className="license-field">
              <label>Format Version:</label>
              <span>{license_data.format_version || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Country:</label>
              <span>{license_data.country || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Decoding Format:</label>
              <span>{result.decoding_format || 'N/A'}</span>
            </div>
            <div className="license-field">
              <label>Payload Size:</label>
              <span>{result.total_payload_size} bytes</span>
            </div>
          </div>

          {/* Security Information */}
          <div className="license-section">
            <h3>🔐 Security</h3>
            <div className="license-field">
              <label>Encryption:</label>
              <span>Static Key XOR</span>
            </div>
            <div className="license-field">
              <label>Compression:</label>
              <span>zlib level 9</span>
            </div>
            <div className="license-field">
              <label>Data Format:</label>
              <span>9-field pipe-delimited</span>
            </div>
          </div>
        </div>

        {/* Photo Section */}
        <div className="license-photo">
          <div className="license-section">
            <h3>📷 Embedded Photo</h3>
            {result.has_image && result.image_base64 ? (
              <div>
                <img
                  src={`data:image/${result.image_format?.toLowerCase() || 'jpeg'};base64,${result.image_base64}`}
                  alt="License Photo"
                  style={{ maxWidth: '150px', maxHeight: '200px' }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  <div>Format: {result.image_format || 'Unknown'}</div>
                  <div>Size: {result.image_size_bytes} bytes</div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                No photo embedded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-4">
        <button onClick={onClear} className="btn btn-primary">
          🔍 Scan Another License
        </button>
        <button 
          onClick={() => {
            const jsonData = JSON.stringify(result, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `license_${license_data.license_number || 'data'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="btn btn-secondary"
        >
          📥 Download JSON
        </button>
      </div>

      {/* Raw Data Section - Collapsible */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>
          🔍 Raw Decoded Data (JSON)
        </summary>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '8px', 
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '8px'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
};