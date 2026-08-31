import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState({
    items: [],
    totalPrice: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCart({ items: [], totalPrice: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiGet('/cart');
      setCart(data.cart || { items: [], totalPrice: 0 });
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
      setCart({ items: [], totalPrice: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    const handleAuthChange = () => {
      fetchCart();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please login first');
      return false;
    }

    try {
      await apiPost('/cart', { productId, quantity });
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert(err.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;

    try {
      await apiPut(`/cart/${productId}`, { quantity });
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  const removeItem = async (productId) => {
    try {
      await apiDelete(`/cart/${productId}`);
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const clearCart = async () => {
    try {
      await apiDelete('/cart');
      await fetchCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        totalItems,
        addToCart,
        fetchCart,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};