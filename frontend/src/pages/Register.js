import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';
import { apiPost } from '../utils/api';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await apiPost('/auth/register', formData);
      setUserId(data._id);
      setMessage('Registration successful! Please verify your email.');
      await sendOTP(data.email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email) => {
    try {
      await apiPost('/auth/send-otp', { email });
      setTimer(60);
      setCanResend(false);
    } catch (error) {
      console.error('OTP send error:', error);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiPost('/auth/verify-otp', { email: formData.email, otp });
      setMessage('Email verified successfully!');

      const loginData = await apiPost('/auth/login', { email: formData.email, password: formData.password });

      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData));
        window.dispatchEvent(new Event('authChange'));
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiPost('/auth/resend-otp', { email: formData.email });
      setMessage('New OTP sent successfully!');
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 pt-24">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-6">
          <span>Register</span>
          <span>Verify OTP</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center text-secondary mb-2">
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {step === 1 ? 'Fill in your details' : 'Enter the OTP sent to your email'}
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

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                minLength="6"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Registering...' : 'Register'}
              <FaArrowRight className="ml-2" />
            </button>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Login
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
                maxLength="6"
                required
              />
              <p className="text-xs text-gray-400 mt-1">OTP sent to {formData.email}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || loading}
                className={`text-sm ${canResend ? 'text-primary hover:underline' : 'text-gray-400'} transition`}
              >
                {canResend ? 'Resend OTP' : `Resend OTP in ${timer}s`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;