import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { apiPost } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiPost('/auth/send-reset-otp', { email });
      setMessage('OTP sent to your email!');
      setTimeout(() => navigate(`/reset-password/${email}`), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 pt-24">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full">
        <Link to="/login" className="text-gray-500 hover:text-primary transition flex items-center text-sm mb-4">
          <FaArrowLeft className="mr-2" /> Back to Login
        </Link>

        <h2 className="text-2xl md:text-3xl font-bold text-center text-secondary mb-2">Forgot Password</h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          Enter your email and we'll send you a reset OTP
        </p>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
          >
            {loading ? 'Sending OTP...' : 'Send Reset OTP'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4 text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;