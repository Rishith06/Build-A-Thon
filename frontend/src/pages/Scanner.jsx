import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Scanner() {
  const [manualCode, setManualCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const navigate = useNavigate();
  // Ref to track if scanner is already rendered
  const scannerRef = useRef(null);

  useEffect(() => {
    // Prevent double initialization in React.StrictMode
    if (scannerRef.current) return;

    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
    );
    scannerRef.current = scanner;

    function onScanSuccess(decodedText) {
        console.log(`Code matched = ${decodedText}`);
        scanner.clear(); // Stop scanning after success
        verifyCode(decodedText);
    }

    function onScanFailure(error) {
        // console.warn(`Code scan error = ${error}`);
    }

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
        scanner.clear().catch(error => {
            console.error("Failed to clear html5-qrcode scanner. ", error)
        });
        scannerRef.current = null;
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode) {
        verifyCode(manualCode);
    }
  };

  const verifyCode = async (code) => {
    try {
        setVerificationResult({ status: 'verifying', message: 'Verifying...' });
        const response = await api.post('admin/verify-qr/', { qr_data: code });
        setVerificationResult({ 
            status: 'valid', 
            message: response.data.message, 
            user: response.data.data.user,
            user_details: response.data.user_details 
        });
    } catch (err) {
        setVerificationResult({ 
            status: 'invalid', 
            message: err.response?.data?.detail || 'Verification Failed' 
        });
    }
  };

  const resetScanner = () => {
    window.location.reload(); 
  };

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <h1>QR Verifier</h1>
      <button onClick={() => navigate('/coordinator')} style={{ marginBottom: '10px' }}>Back to Coordinator Panel</button>

      <div style={{ background: '#222', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
        {verificationResult ? (
            <div style={{ 
                padding: '20px', 
                background: verificationResult.status === 'valid' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(220, 53, 69, 0.2)',
                border: verificationResult.status === 'valid' ? '1px solid #4caf50' : '1px solid #dc3545',
                borderRadius: '8px'
            }}>
                <h2 style={{ color: verificationResult.status === 'valid' ? '#4caf50' : '#dc3545' }}>
                    {verificationResult.status === 'valid' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </h2>
                
                {verificationResult.user_details && (
                    <div style={{ margin: '15px 0', textAlign: 'center' }}>
                         {verificationResult.user_details.photo_url ? (
                             <img 
                                src={`http://localhost:8000${verificationResult.user_details.photo_url}`} 
                                alt="User" 
                                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #4caf50' }}
                             />
                         ) : (
                             <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#ccc', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '3em', color: '#555' }}>?</span>
                             </div>
                         )}
                         <h3 style={{ margin: '10px 0 5px 0' }}>{verificationResult.user_details.name}</h3>
                         <p style={{ margin: '0', textTransform: 'capitalize' }}>{verificationResult.user_details.role}</p>
                    </div>
                )}

                <p>{verificationResult.message}</p>
                <button onClick={resetScanner} style={{ marginTop: '10px' }}>Scan Next</button>
            </div>
        ) : (
            <div>
                 <h3>Camera Scan</h3>
                 <div id="reader" style={{ width: '100%' }}></div>
                 <p style={{ fontSize: '0.8em', color: '#ccc', marginTop: '10px' }}>
                    If prompted, allow camera access.
                 </p>
            </div>
        )}
      </div>

      <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '20px' }}>
        <h3>Manual Entry</h3>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input 
                type="text" 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter QR Data String" 
                style={{ flex: 1 }}
            />
            <button type="submit">Verify</button>
        </form>
      </div>
    </div>
  );
}

export default Scanner;
