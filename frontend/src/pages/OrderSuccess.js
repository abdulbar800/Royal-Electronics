import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight, FaShoppingBag, FaClock } from 'react-icons/fa';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const orderId = location.state?.orderId || null;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
  }, [token, navigate]);

  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setOrder(data.order);
        } else {
          setError(data.message || 'Could not fetch order details');
        }
      } catch (err) {
        console.error(' Fetch order error:', err);
        setError('Server error while fetching order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="container mx-auto px-4 py-12 pt-32">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <FaCheckCircle className="text-6xl text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
           Order Placed Successfully!
        </h1>

        <p className="text-gray-500 text-lg mb-2">
          Thank you for shopping with <strong className="text-primary">Royal Electronics</strong>
        </p>

        <p className="text-gray-400 text-sm mb-8">
          Your order has been placed and will be processed shortly.
          You will receive a confirmation email soon.
        </p>

        {/* Order Details Card */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">

          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-gray-400 text-sm mt-2">Loading order details...</p>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm text-center py-2">{error}</p>
          ) : order ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Order ID</span>
                <span className="font-medium text-sm">#{order._id.toString().slice(-8)}</span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Order Status</span>
                <span className={`font-medium ${
                  order.orderStatus === 'Cancelled' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {order.orderStatus === 'Cancelled' ? ' Cancelled' : ` ${order.orderStatus}`}
                </span>
              </div>

              {/*  REAL PAYMENT STATUS - ab backend se actual isPaid check ho raha hai */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Payment</span>
                {order.isPaid ? (
                  <span className="text-green-600 font-medium"> Paid</span>
                ) : order.paymentMethod === 'COD' ? (
                  <span className="text-orange-500 font-medium flex items-center">
                    <FaClock className="mr-1" /> Pay on Delivery
                  </span>
                ) : (
                  <span className="text-orange-500 font-medium flex items-center">
                    <FaClock className="mr-1" /> Pending
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium">
                  {order.paymentMethod === 'COD' ? '📦 Cash on Delivery' : '💳 Razorpay'}
                </span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-medium">₹{Number(order.totalPrice).toFixed(2)}</span>
              </div>

              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="text-gray-500">Estimated Delivery</span>
                <span className="font-medium">{estimatedDelivery}</span>
              </div>
            </>
          ) : (
            // orderId hi nahi mila (jaise seedha URL type karke aaya user) - generic fallback
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">Order Status</span>
                <span className="text-green-600 font-medium"> Confirmed</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="text-gray-500">Estimated Delivery</span>
                <span className="font-medium">{estimatedDelivery}</span>
              </div>
              <p className="text-gray-400 text-xs mt-3">
                For exact payment status, please check "My Orders".
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/orders"
            className="flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition"
          >
            <FaShoppingBag className="mr-2" />
            View My Orders
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center border-2 border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition"
          >
            Continue Shopping
            <FaArrowRight className="ml-2" />
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-gray-400 text-xs mt-8">
          For any questions, contact our support team at support@royalelectronics.com
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
