import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTag, FaTimes, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { apiPost } from '../utils/api';

const Checkout = () => {

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { cart, loading, clearCart } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applying, setApplying] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState(null);

  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    paymentMethod: 'RAZORPAY'
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // =====================================================
  // APPLY COUPON
  // =====================================================
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplying(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const data = await apiPost('/coupons/validate', {
        code: couponCode,
        orderAmount: cart.totalPrice
      });

      if (data.valid) {
        setCouponApplied(data.coupon);
        setDiscountAmount(Number(data.discountAmount) || 0);
        setCouponSuccess(`Coupon applied! You saved ₹${Number(data.discountAmount).toFixed(2)}`);
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon');
        setCouponApplied(null);
        setDiscountAmount(0);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setCouponError(error.message || 'Server error. Please try again.');
      setCouponApplied(null);
      setDiscountAmount(0);
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  // =====================================================
  // ✅ CANCEL PENDING ORDER (payment modal closed / failed)
  // =====================================================
  const cancelPendingOrder = async (pendingOrderId) => {
    if (!pendingOrderId) return;
    try {
      const data = await apiPost(`/orders/${pendingOrderId}/cancel-pending`, {});
      console.log('Pending order cancelled, cart & stock restored:', data);
    } catch (err) {
      console.error('Cancel pending order error:', err);
    }
  };

  // =====================================================
  // ✅ RAZORPAY PAYMENT
  // =====================================================
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (currentOrderId, razorpayOrder, finalTotal, keyId) => {
    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setSubmitting(false);
        return;
      }

      if (!window.Razorpay) {
        alert('Razorpay SDK not available. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      console.log('Using Razorpay Key ID (from Backend):', keyId);

      if (!keyId) {
        alert('Razorpay Key ID missing from backend. Please contact support.');
        setSubmitting(false);
        return;
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Royal Electronics',
        description: `Order #${currentOrderId.slice(-6)}`,
        order_id: razorpayOrder.id,
        handler: async function(response) {
          try {
            await apiPost(`/orders/${currentOrderId}/confirm-payment`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            navigate('/order-success', { state: { orderId: currentOrderId } });
          } catch (error) {
            console.error('Confirm payment error:', error);
            alert('Payment confirmation failed: ' + (error.message || 'Please contact support.'));
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: async function() {
            await cancelPendingOrder(currentOrderId);
            setSubmitting(false);
            console.log('Payment modal closed - order cancelled, cart restored');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || ''
        },
        theme: {
          color: '#e94560'
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', async function(response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + (response.error?.description || 'Please try again'));
        await cancelPendingOrder(currentOrderId);
        setSubmitting(false);
      });

      razorpayInstance.open();

    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Payment error. Please try again.');
      setSubmitting(false);
    }
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: formData.paymentMethod,
        taxPrice: 0,
        shippingPrice: 0,
        couponCode: couponApplied ? couponApplied.code : null
      };

      console.log('Sending Order Data:', orderData);

      const orderDataRes = await apiPost('/orders', orderData);
      console.log('Order Response:', orderDataRes);

      if (formData.paymentMethod === 'RAZORPAY' && orderDataRes.razorpayOrder) {
        const newOrderId = orderDataRes.order._id;
        const razorpayOrder = orderDataRes.razorpayOrder;
        const keyId = razorpayOrder.key_id;

        console.log('Received Key ID from Backend:', keyId);

        setOrderId(newOrderId);
        setRazorpayKeyId(keyId);

        await handleRazorpayPayment(newOrderId, razorpayOrder, orderDataRes.order.totalPrice, keyId);
        return;
      }

      // COD
      navigate('/order-success', { state: { orderId: orderDataRes.order._id } });

    } catch (error) {
      console.error('Order error:', error);
      alert('❌ ' + (error.message || 'Server error. Please try again.'));
      setSubmitting(false);
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

  const cartItems = cart?.items || [];
  const totalPrice = Number(cart?.totalPrice) || 0;
  const finalTotal = Math.max(0, totalPrice - discountAmount);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link to="/products" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">

      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-primary transition mb-6">
        <FaArrowLeft className="mr-2" /> Back to Cart
      </button>

      <div className="flex flex-col lg:flex-row gap-8">

        <div className="lg:w-2/3">
          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="RAZORPAY">💳 Credit/Debit Card, UPI, Net Banking</option>
                  <option value="COD">📦 Cash on Delivery</option>
                </select>
                {formData.paymentMethod === 'RAZORPAY' && (
                  <p className="text-xs text-gray-400 mt-1">Secure payment via Razorpay</p>
                )}
                {formData.paymentMethod === 'COD' && (
                  <p className="text-xs text-gray-400 mt-1">Pay when you receive the order</p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <FaTag className="mr-2 text-primary" /> Apply Coupon
                </h3>

                {couponSuccess && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg mb-3 text-sm flex justify-between items-center">
                    <span>{couponSuccess}</span>
                    <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700">
                      <FaTimes />
                    </button>
                  </div>
                )}

                {couponError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-3 text-sm">
                    {couponError}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!couponApplied}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applying || !!couponApplied}
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
                  >
                    {applying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

            </form>
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl shadow p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4">Order Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₹{totalPrice.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center">
                {formData.paymentMethod === 'RAZORPAY' ? (
                  <>
                    <FaCreditCard className="mr-2 text-primary" />
                    Pay via Razorpay
                  </>
                ) : (
                  <>
                    <FaMoneyBillWave className="mr-2 text-primary" />
                    Cash on Delivery
                  </>
                )}
              </p>
            </div>

            {couponApplied && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  🏷️ Coupon <strong>{couponApplied.code}</strong> applied!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;