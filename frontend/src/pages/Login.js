import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';
import { apiPost } from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiPost('/auth/login', { email, password });

      if (data.requires2FA) {
        setPendingUserId(data.userId);
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setSuccess('Login successful!');
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/';
    } catch (err) {
      console.error(' Login error:', err);
      setError(err.message || 'Invalid email or password');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/2fa/verify-login', { userId: pendingUserId, token: twoFACode });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setSuccess('Login successful!');
      window.dispatchEvent(new Event('authChange'));
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 pt-24">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-secondary mb-6">
          {requires2FA ? 'Two-Factor Verification' : 'Welcome Back!'}
        </h2>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-center font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center mt-3">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <p className="text-center text-gray-500 mt-4 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Register
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="text-center mb-2">
              <FaShieldAlt className="text-4xl text-primary mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <input
              type="text"
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
              maxLength="6"
              required
              autoFocus
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => { setRequires2FA(false); setTwoFACode(''); setError(''); }}
              className="w-full text-gray-500 text-sm hover:text-primary transition"
            >
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;