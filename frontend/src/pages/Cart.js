import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [updating, setUpdating] = useState(false);
  const [localCart, setLocalCart] = useState({ items: [], totalPrice: 0 });
  const [localLoading, setLocalLoading] = useState(true);

  const { cart, loading, totalItems, updateQuantity, removeItem, clearCart, fetchCart } = useCart();

  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
    setLocalCart(cart);
    setLocalLoading(loading);
  }, [token, navigate]);

  // Update local state when cart changes
  useEffect(() => {
    setLocalCart(cart);
    setLocalLoading(loading);
  }, [cart, loading]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCart();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [fetchCart]);

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity < 1) return;
    setUpdating(true);
    await updateQuantity(productId, quantity);
    await fetchCart();
    setUpdating(false);
  };

  const handleRemoveItem = async (productId) => {
    setUpdating(true);
    await removeItem(productId);
    await fetchCart();
    setUpdating(false);
  };

  const handleClearCart = async () => {
    setUpdating(true);
    await clearCart();
    await fetchCart();
    setUpdating(false);
  };

  if (localLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Loading cart...</p>
      </div>
    );
  }

  const cartItems = localCart?.items || cart?.items || [];
  const totalPrice = localCart?.totalPrice || cart?.totalPrice || 0;

  console.log('🛒 Cart Items:', cartItems);
  console.log('🛒 Total Items:', totalItems);

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 flex items-center">
        <FaShoppingCart className="mr-3 text-primary" />
        Your Cart
        <span className="ml-3 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
          {totalItems} items
        </span>
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link to="/products" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition inline-block">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-4">
            {cartItems.map((item, index) => {
              const productId = item.product?._id || item.product;
              return (
                <div key={item._id || index} className="bg-white rounded-2xl shadow p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-lg transition">
                  <img
                    src={item.image || 'https://via.placeholder.com/80'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-secondary">{item.name}</h3>
                    <p className="text-primary font-bold">₹{item.price}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                      disabled={updating || item.quantity <= 1}
                      className="p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      <FaMinus className="text-sm" />
                    </button>
                    <span className="w-10 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                      disabled={updating}
                      className="p-2 border rounded-lg hover:bg-gray-100 transition"
                    >
                      <FaPlus className="text-sm" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-center sm:text-left min-w-[80px]">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-secondary">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveItem(productId)}
                    disabled={updating}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}

            {/* Clear Cart */}
            <button
              onClick={handleClearCart}
              disabled={updating}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition"
            >
              Clear Cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className={`w-full mt-4 bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition text-center block ${cartItems.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;