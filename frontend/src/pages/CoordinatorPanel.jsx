import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../api';

function CoordinatorPanel() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [scanMode, setScanMode] = useState(null); // 'qr' or 'face' (QR redirects, Face is inline)
  const [imgSrc, setImgSrc] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [reportMode, setReportMode] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    verifyFace(imageSrc);
  }, [webcamRef]);

  const verifyFace = async (base64Image) => {
      setLoading(true);
      setVerificationResult(null);
      setReportMode(false); // Reset report mode on new scan
      setComplaintText('');
      
      try {
          // Convert base64 to blob
          const res = await fetch(base64Image);
          const blob = await res.blob();
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          
          const formData = new FormData();
          formData.append('image', file);
          
          const response = await api.post('admin/face-recognize/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          setVerificationResult({ success: true, daa: response.data, raw_image: file });
      } catch (err) {
          console.error(err);
          setVerificationResult({ 
              success: false, 
              message: err.response?.data?.detail || "Face verification failed." 
          });
      } finally {
          setLoading(false);
      }
  };

  const submitComplaint = async () => {
    if (!complaintText) return;
    
    try {
        const formData = new FormData();
        formData.append('username', verificationResult.daa.user_details.name);
        formData.append('description', complaintText);
        if (verificationResult.raw_image) {
            formData.append('proof_photo', verificationResult.raw_image);
        }
        
        await api.post('complaints/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        alert('Complaint submitted successfully.');
        setReportMode(false);
        setComplaintText('');
    } catch (err) {
        console.error(err);
        alert('Failed to submit complaint.');
    }
  };

  const resetScan = () => {
      setImgSrc(null);
      setVerificationResult(null);
      setReportMode(false);
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Coordinator Panel</h1>
      <p style={{ color: '#aaa' }}>Welcome. Select verification mode.</p>
      
      {!scanMode ? (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
            <button onClick={() => navigate('/scanner')} style={{ background: '#007bff', fontSize: '1.2em', padding: '20px', minWidth: '200px' }}>
                📷 QR Scanner
            </button>
            <button onClick={() => setScanMode('face')} style={{ background: '#6f42c1', fontSize: '1.2em', padding: '20px', minWidth: '200px' }}>
                👤 Face Scan
            </button>
        </div>
      ) : (
          <div style={{ marginTop: '20px' }}>
              <button onClick={() => setScanMode(null)} style={{ background: '#666', marginBottom: '20px' }}>← Back</button>
              
              <div style={{ background: '#222', padding: '20px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto' }}>
                  <h3>Face Verification</h3>
                  
                  {imgSrc ? (
                      <img src={imgSrc} alt="Captured" style={{ width: '100%', borderRadius: '8px' }} />
                  ) : (
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        style={{ width: '100%', borderRadius: '8px' }}
                      />
                  )}

                  <div style={{ marginTop: '20px' }}>
                      {!imgSrc ? (
                          <button onClick={capture} style={{ background: '#28a745', fontSize: '1.1em', padding: '10px 30px' }}>
                              Capture & Verify
                          </button>
                      ) : (
                          <button onClick={resetScan} style={{ background: '#007bff', padding: '10px 20px' }}>
                              Scan Again
                          </button>
                      )}
                  </div>

                  {loading && <p style={{ color: '#ffc107', marginTop: '10px' }}>Verifying...</p>}
                  
                  {verificationResult && (
                      <div style={{ marginTop: '20px', padding: '15px', borderRadius: '5px', background: verificationResult.success ? 'rgba(76, 175, 80, 0.2)' : 'rgba(220, 53, 69, 0.2)', border: `1px solid ${verificationResult.success ? '#4caf50' : '#dc3545'}` }}>
                          {verificationResult.success ? (
                              <div style={{ textAlign: 'left' }}>
                                  <h2 style={{ color: '#4caf50', margin: '0 0 10px 0' }}>ACCESS GRANTED</h2>
                                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                      {verificationResult.daa.user_details.photo_url && (
                                          <img src={`http://127.0.0.1:8000${verificationResult.daa.user_details.photo_url}`} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                                      )}
                                      <div>
                                          <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{verificationResult.daa.user_details.name}</div>
                                          <div style={{ color: '#ccc' }}>
                                              {verificationResult.daa.user_details.role} • {verificationResult.daa.user_details.student_type}
                                          </div>
                                          {verificationResult.daa.user_details.college_name && (
                                              <div style={{ color: '#ffc107' }}>{verificationResult.daa.user_details.college_name}</div>
                                          )}
                                      </div>
                                  </div>
                                  <div style={{ marginTop: '15px' }}>
                                      <button 
                                        onClick={() => setReportMode(true)}
                                        style={{ background: '#dc3545', padding: '8px 15px', fontSize: '0.9em' }}
                                      >
                                        ⚠️ Report Incident
                                      </button>
                                  </div>
                              </div>
                          ) : (
                              <div style={{ color: '#ff6b6b' }}>
                                  <strong>ACCESS DENIED</strong><br/>
                                  {verificationResult.message}
                              </div>
                          )}
                      </div>
                  )}

                  {reportMode && verificationResult?.success && (
                      <div style={{ marginTop: '20px', padding: '15px', background: '#333', borderRadius: '5px' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Report Incident: {verificationResult.daa.user_details.name}</h4>
                          <textarea 
                             rows="4" 
                             placeholder="Describe the incident..." 
                             value={complaintText}
                             onChange={(e) => setComplaintText(e.target.value)}
                             style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none', marginBottom: '10px' }}
                          />
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                              <button onClick={() => setReportMode(false)} style={{ background: '#666' }}>Cancel</button>
                              <button onClick={submitComplaint} style={{ background: '#dc3545' }}>Submit Report</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div style={{ marginTop: '50px' }}>
        <button onClick={handleLogout} style={{ background: '#dc3545' }}>Logout</button>
      </div>
    </div>
  );
}

export default CoordinatorPanel;
