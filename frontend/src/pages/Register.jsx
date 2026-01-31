import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [studentType, setStudentType] = useState('internal');
  const [collegeName, setCollegeName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Use FormData for file upload
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('email', email);
    formData.append('role', role);
    formData.append('student_type', studentType);
    if (studentType === 'external') {
        formData.append('college_name', collegeName);
    }

    if (photo) {
        formData.append('photo', photo);
    }

    try {
      await api.post('register/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Username may be taken.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mb-2">
            Create Account
          </h2>
          <p className="text-[var(--text-muted)]">
            Join the hackathon community
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.3)] text-[#ff453a] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="flex justify-center gap-2 mb-4 bg-[rgba(255,255,255,0.03)] p-1 rounded-lg">

            </div>

            <div className="space-y-4">
                     <div className="flex justify-center gap-2 mb-4 bg-[rgba(255,255,255,0.03)] p-1 rounded-lg">
                        {['internal', 'external'].map((t) => (
                            <button
                            key={t}
                            type="button"
                            onClick={() => setStudentType(t)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 capitalize ${
                                studentType === t 
                                ? 'bg-[var(--primary)] text-black shadow-[0_0_10px_var(--primary-glow)]' 
                                : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                            >
                            {t === 'internal' ? 'From This College' : 'From Other College'}
                            </button>
                        ))}
                    </div>
                </div>
            
            {studentType === 'external' && (
                 <Input 
                 label="College Name"
                 placeholder="Enter your college name"
                 value={collegeName} 
                 onChange={(e) => setCollegeName(e.target.value)} 
                 required
               />
            )}

          <div className="space-y-4">
            <Input 
              label="Username"
              placeholder="Choose a username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required
            />
             <Input 
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
            <Input 
              label="Password"
              type="password"
              placeholder="Choose a strong password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
            <Input 
              label="Profile Photo (Optional)"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-black hover:file:bg-[var(--primary-glow)]"
            />
          </div>

          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full mt-6"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--primary)] hover:underline hover:text-[var(--primary-glow)] transition-colors">
            Login here
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Register;
