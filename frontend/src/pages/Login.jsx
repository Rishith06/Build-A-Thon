import React, { useState } from 'react';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('login/', { username, password });
      localStorage.setItem('token', response.data.token);
      
      // Navigate based on selected role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'coordinator') {
        navigate('/coordinator');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.response) {
         setError(`Login failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
         setError('Login failed: No response from server. Is it running?');
      } else {
         setError(`Login failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mb-2">
            Welcome Back
          </h2>
          <p className="text-[var(--text-muted)]">
            Sign in to access your dashboard
          </p>
        </div>
        
        <div className="flex justify-center gap-2 mb-8 bg-[rgba(255,255,255,0.03)] p-1 rounded-lg">
          {['user', 'coordinator', 'admin'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-300 capitalize ${
                role === r 
                  ? 'bg-[var(--primary)] text-black shadow-[0_0_15px_var(--primary-glow)]' 
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3 mb-6 rounded bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.3)] text-[#ff453a] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Username"
            placeholder="Enter your username"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
          />
          <Input 
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          
          <Button 
            type="submit" 
            variant="gradient" 
            className="w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--primary)] hover:underline hover:text-[var(--primary-glow)] transition-colors">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default Login;
