import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaShoppingCart, FaUser, FaBars, FaTimes, FaHome,
  FaBox, FaSignOutAlt, FaTachometerAlt, FaClipboardList,
  FaUserCircle, FaChevronDown
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const { totalItems } = useCart();

  //  Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  //  CHECK AUTH STATE
  useEffect(() => {
    const checkAuth = () => {
      const newToken = localStorage.getItem('token');
      const newUser = JSON.parse(localStorage.getItem('user') || '{}');
      setToken(newToken);
      setUser(newUser);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  // LOGOUT - SIRF TOKEN HATAO
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setToken(null);
    setUser({});
    setIsOpen(false);
    setDropdownOpen(false);
    
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <FaHome className="mr-2" /> },
    { name: 'Products', path: '/products', icon: <FaBox className="mr-2" /> },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-secondary shadow-2xl py-2' : 'bg-secondary/90 backdrop-blur-sm py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-3xl float-animation">🛒</span>
            <div>
              <span className="text-2xl font-extrabold text-white group-hover:text-primary transition duration-300">
                Royal <span className="text-primary">Electronics</span>
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="flex items-center text-white/80 hover:text-white transition duration-300 text-sm font-medium relative group"
              >
                {link.icon}
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}

            {token && (
              <Link
                to="/orders"
                className="flex items-center text-white/80 hover:text-white transition duration-300 text-sm font-medium relative group"
              >
                <FaClipboardList className="mr-2" />
                My Orders
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}

            {token && user.role === 'admin' && (
              <Link
                to="/dashboard"
                className="flex items-center text-white/80 hover:text-white transition duration-300 text-sm font-medium relative group"
              >
                <FaTachometerAlt className="mr-2" />
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}

            <Link to="/cart" className="flex items-center text-white/80 hover:text-white transition duration-300 text-sm font-medium relative group">
              <FaShoppingCart className="mr-2" />
              Cart
              <span className="absolute -top-2 -right-3 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>

            {token ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-full hover:bg-white/20 transition-all duration-300 text-sm font-medium border border-white/20"
                >
                  <FaUserCircle className="text-xl" />
                  <span className="max-w-[100px] truncate">{user.name || 'User'}</span>
                  <FaChevronDown className={`text-xs transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-4 bg-gradient-to-r from-primary/10 to-secondary/5 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl text-primary">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-secondary">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email || ''}</p>
                          {user.role === 'admin' && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/my-account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700"
                      >
                        <FaUser className="text-gray-400" />
                        My Account
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700"
                      >
                        <FaClipboardList className="text-gray-400" />
                        My Orders
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-sm text-gray-700"
                        >
                          <FaTachometerAlt className="text-gray-400" />
                          Dashboard
                        </Link>
                      )}
                      <div className="border-t my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-sm text-red-600 w-full text-left"
                      >
                        <FaSignOutAlt className="text-red-400" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full hover:bg-white/20 transition-all duration-300 text-sm font-medium border border-white/20">
                <FaUser className="mr-2" />
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white text-2xl focus:outline-none p-2 rounded-lg hover:bg-white/10 transition"
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-4 pb-6 space-y-2 border-t border-white/10 mt-4 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-white text-2xl hover:text-primary transition p-2"
            >
              <FaTimes />
            </button>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center py-3 px-4 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            {token && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-3 px-4 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
                >
                  <FaClipboardList className="mr-2" />
                  My Orders
                </Link>
                <Link
                  to="/my-account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-3 px-4 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
                >
                  <FaUser className="mr-2" />
                  My Account
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center py-3 px-4 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
                  >
                    <FaTachometerAlt className="mr-2" />
                    Dashboard
                  </Link>
                )}
              </>
            )}

            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="flex items-center py-3 px-4 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
            >
              <FaShoppingCart className="mr-2" />
              Cart
              <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>

            {token ? (
              <>
                <div className="px-4 py-3 border-t border-white/10 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg text-primary">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-400">{user.email || ''}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full py-3 px-4 hover:bg-white/10 rounded-xl transition text-red-400"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center py-3 px-4 bg-primary rounded-xl text-center hover:bg-primary/80 transition"
              >
                <FaUser className="mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;