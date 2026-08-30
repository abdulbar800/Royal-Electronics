import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, FaCheckCircle, FaClock, FaTruck, FaRupeeSign, 
  FaTimesCircle, FaCreditCard, FaMoneyBillWave, FaPaypal, FaWallet
} from 'react-icons/fa';
import { apiGet, apiPut } from '../utils/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await apiGet('/orders/myorders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(orderId);
    try {
      await apiPut(`/orders/${orderId}/cancel`, {});
      alert('✅ Order cancelled successfully!');
      await fetchOrders();
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed to cancel order'));
    } finally {
      setCancelling(null);
    }
  };

  const getPaymentDisplay = (method) => {
    switch (method) {
      case 'Credit Card':
        return '💳 Credit Card';
      case 'Debit Card':
        return '💳 Debit Card';
      case 'PayPal':
        return '💲 PayPal';
      case 'Razorpay':
        return '💲 Razorpay';
      case 'COD':
        return '📦 Cash on Delivery';
      default:
        return method || '💳 Credit Card';
    }
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'Credit Card':
        return <FaCreditCard className="text-blue-500" />;
      case 'Debit Card':
        return <FaCreditCard className="text-green-500" />;
      case 'PayPal':
        return <FaPaypal className="text-blue-600" />;
      case 'Razorpay':
        return <FaWallet className="text-purple-500" />;
      case 'COD':
        return <FaMoneyBillWave className="text-green-600" />;
      default:
        return <FaCreditCard className="text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <FaClock className="text-yellow-500 text-xl" />;
      case 'Processing':
        return <FaBox className="text-blue-500 text-xl" />;
      case 'Shipped':
        return <FaTruck className="text-purple-500 text-xl" />;
      case 'Delivered':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'Cancelled':
        return <FaTimesCircle className="text-red-500 text-xl" />;
      default:
        return <FaClock className="text-gray-500 text-xl" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Shipped':
        return 'bg-purple-100 text-purple-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = (status) => {
    return status === 'Pending' || status === 'Processing';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <FaBox className="mr-3 text-primary" />
          My Orders
        </h1>
        <Link to="/" className="text-primary hover:underline text-sm">
          Continue Shopping →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg mb-4">No orders yet</p>
          <Link to="/products" className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-gray-500">Order #{order._id.slice(-8)}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {getPaymentIcon(order.paymentMethod)}
                    {getPaymentDisplay(order.paymentMethod)}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="px-6 py-4">
                {order.orderItems?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 py-2 border-b last:border-b-0">
                    <img
                      src={item.image || 'https://via.placeholder.com/50'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-secondary">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold text-primary">₹{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.orderStatus)}
                  <span className="text-sm text-gray-600">
                    {order.orderStatus === 'Delivered' ? 'Delivered successfully' :
                     order.orderStatus === 'Cancelled' ? 'Order cancelled' :
                     `Expected delivery: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}`}
                  </span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className="text-xl font-bold text-primary">₹{order.totalPrice}</span>

                  {canCancel(order.orderStatus) && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      disabled={cancelling === order._id}
                      className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50 text-sm"
                    >
                      <FaTimesCircle className="mr-2" />
                      {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;