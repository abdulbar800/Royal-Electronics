import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaUserTag, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaEdit, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import { apiGet, apiPut } from '../utils/api';

const MyAccount = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!userData._id && token) {
      fetchUserData();
      return;
    }

    setUser(userData);
    setFormData({ name: userData.name || '', email: userData.email || '' });
    setLoading(false);
  }, []);

  const fetchUserData = async () => {
    try {
      const data = await apiGet('/auth/me');
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setFormData({ name: data.user.name || '', email: data.user.email || '' });
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const userId = user?._id || user?.id;
    if (!userId) {
      setError('Please login again');
      return;
    }

    try {
      const data = await apiPut(`/auth/users/${userId}`, { name: formData.name, email: formData.email });
      setMessage('Profile updated successfully!');
      const updatedUser = data.user || { ...user, name: formData.name, email: formData.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditMode(false);
      setTimeout(() => setMessage(''), 3000);
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      setError('❌ ' + (err.message || 'Failed to update profile'));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const userId = user?._id || user?.id;
    if (!userId) {
      setError('Please login again');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await apiPut(`/auth/users/${userId}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Password changed successfully!');
      setPasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('❌ ' + (err.message || 'Failed to change password'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <p className="text-gray-500">Please login to view your account</p>
        <Link to="/login" className="text-primary hover:underline">Login</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-primary transition mb-6"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Account</h1>

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

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-secondary/5 px-6 py-8 text-center relative">
            <div className="w-24 h-24 rounded-full bg-primary/30 mx-auto flex items-center justify-center text-4xl text-primary">
              {user.name?.charAt(0) || 'U'}
            </div>
            <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs mt-2 ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-600'}`}>
              {user.role === 'admin' ? 'Admin' : 'User'}
            </span>

            <button
              onClick={() => {
                setEditMode(!editMode);
                setPasswordMode(false);
                setMessage('');
                setError('');
              }}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:shadow-lg transition"
            >
              <FaEdit className="text-primary" />
            </button>
          </div>

          {editMode && (
            <div className="px-6 py-6 border-b bg-gray-50">
              <h3 className="font-semibold mb-4 flex items-center">
                <FaEdit className="mr-2 text-primary" /> Edit Profile
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition flex items-center">
                    <FaSave className="mr-2" /> Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setMessage(''); setError(''); }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
                  >
                    <FaTimes className="mr-2" /> Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="px-6 py-6 divide-y">
            <div className="py-4 flex items-center gap-4">
              <FaUser className="text-gray-400 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <div className="py-4 flex items-center gap-4">
              <FaEnvelope className="text-gray-400 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="py-4 flex items-center gap-4">
              <FaUserTag className="text-gray-400 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>

            <div className="py-4 flex items-center gap-4">
              {user.isEmailVerified ? (
                <FaCheckCircle className="text-green-500 text-xl" />
              ) : (
                <FaTimesCircle className="text-red-500 text-xl" />
              )}
              <div>
                <p className="text-sm text-gray-500">Email Verified</p>
                <p className="font-medium">
                  {user.isEmailVerified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t">
            {!passwordMode ? (
              <button
                onClick={() => { setPasswordMode(true); setEditMode(false); setMessage(''); setError(''); }}
                className="w-full border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition"
              >
                <FaLock className="inline mr-2" /> Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <h3 className="font-semibold flex items-center">
                  <FaLock className="mr-2 text-primary" /> Change Password
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition flex items-center">
                    <FaSave className="mr-2" /> Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPasswordMode(false); setMessage(''); setError(''); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition flex items-center"
                  >
                    <FaTimes className="mr-2" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;