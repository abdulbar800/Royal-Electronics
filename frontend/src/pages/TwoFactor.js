import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaQrcode, FaShieldAlt, FaKey, FaArrowLeft } from 'react-icons/fa';
import { apiPost, apiDelete } from '../utils/api';

const TwoFactor = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsEnabled(user.isTwoFactorEnabled || false);
  }, []);

  const enable2FA = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await apiPost('/2fa/enable');
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setSecret(data.secret);
      setStep(2);
      setMessage('Scan QR code with Google Authenticator');
    } catch (err) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiPost('/2fa/verify', { token: verificationCode });
      setMessage('2FA enabled successfully!');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.isTwoFactorEnabled = true;
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('authChange'));
      setIsEnabled(true);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const code = prompt('Enter your 2FA verification code to disable:');
    if (!code) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiDelete('/2fa/disable');
      setMessage('2FA disabled successfully!');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.isTwoFactorEnabled = false;
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('authChange'));
      setIsEnabled(false);
    } catch (err) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 pt-24">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-primary transition flex items-center text-sm mb-4"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>

        <h2 className="text-2xl md:text-3xl font-bold text-center text-secondary mb-2 flex items-center justify-center">
          <FaShieldAlt className="text-primary mr-2" /> Two-Factor Authentication
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {isEnabled ? '2FA is enabled on your account' : 'Add an extra layer of security'}
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

        {isEnabled ? (
          <div className="text-center py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-600 font-medium">2FA is currently ENABLED</p>
            </div>
            <button
              onClick={disable2FA}
              disabled={loading}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : step === 1 ? (
          <div>
            <p className="text-gray-600 text-sm mb-4">
              Two-factor authentication adds an extra layer of security to your account.
              You'll need to enter a code from your authenticator app to log in.
            </p>
            <button
              onClick={enable2FA}
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Enabling...' : 'Enable 2FA'}
            </button>
          </div>
        ) : step === 2 ? (
          <div>
            <p className="text-gray-600 text-sm mb-4">
              1. Scan the QR code with Google Authenticator
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-4 flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              Can't scan? Enter this secret manually: <strong>{secret}</strong>
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-700">
                <strong>Backup Codes:</strong> Save these somewhere safe!
              </p>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {backupCodes.map((code, i) => (
                  <span key={i} className="text-xs font-mono bg-white px-2 py-1 rounded border">
                    {code}
                  </span>
                ))}
              </div>
            </div>
            <form onSubmit={verify2FA} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 6-digit code from Authenticator
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-center text-2xl tracking-widest"
                  maxLength="6"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <FaShieldAlt className="text-6xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-600">2FA Enabled!</h3>
            <p className="text-gray-500 mt-2">
              Your account is now protected with 2FA.
            </p>
            <button
              onClick={() => navigate('/my-account')}
              className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition"
            >
              Go to Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactor;