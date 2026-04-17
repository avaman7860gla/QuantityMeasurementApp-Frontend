import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Mail, Lock, User, UserPlus } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send only required fields
      await api.post('/auth/register', {
        username: username,
        password: password
      });

      // Redirect to login after success
      navigate('/login');

    }
    catch (err) {
      setError(
        err.response?.data ||
        'Registration failed, please try again.'
      );
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: '20px'
    }}>
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          textAlign: 'center'
        }}
      >
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}>
          <UserPlus size={32} color="var(--accent)" />
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Join us to access Quantity Measurement App
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '48px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '48px' }}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '48px' }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? <div className="loader"></div> : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

