import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUsers, FaBox, FaShoppingCart, FaRupeeSign, 
  FaEye, FaCheckCircle, FaClock, FaTruck, 
  FaTimesCircle, FaPlus, FaTag, FaExclamationTriangle,
  FaArrowRight, FaArrowUp, FaArrowDown, FaFire,
  FaEdit, FaTrash, FaImage, FaVideo, FaToggleOn, FaToggleOff
} from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    stock: '',
    images: [''],
    video: ''
  });
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: '1'
  });
  const [productMessage, setProductMessage] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [imageInputs, setImageInputs] = useState(['']);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const statsData = await apiGet('/admin/dashboard/stats');
      setStats(statsData.stats);

      setTopProducts(statsData.stats?.topProducts || []);
      setDailyData(statsData.stats?.dailyData || []);
      setMonthlyRevenue(statsData.stats?.monthlyRevenue || []);

      const ordersData = await apiGet('/admin/dashboard/recent-orders');
      setRecentOrders(ordersData.orders || []);

      const productData = await apiGet('/products');
      const allProductsData = productData.products || [];
      setAllProducts(allProductsData);

      const lowStock = allProductsData.filter(p => p.stock > 0 && p.stock <= 10);
      setLowStockProducts(lowStock);

      const outOfStock = allProductsData.filter(p => p.stock === 0);
      setOutOfStockProducts(outOfStock);

      const couponData = await apiGet('/coupons');
      setCoupons(couponData.coupons || []);

      const userData = await apiGet('/auth/users');
      setUsers(userData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ PRODUCT FUNCTIONS
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage('');

    const endpoint = editingProduct ? `/products/${editingProduct._id}` : '/products';
    const body = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock),
      images: productForm.images.filter(img => img.trim() !== ''),
      video: productForm.video || ''
    };

    try {
      if (editingProduct) {
        await apiPut(endpoint, body);
      } else {
        await apiPost(endpoint, body);
      }

      setProductMessage(`✅ Product ${editingProduct ? 'updated' : 'added'} successfully!`);
      setShowProductModal(false);
      setProductForm({ name: '', description: '', price: '', category: '', brand: '', stock: '', images: [''], video: '' });
      setImageInputs(['']);
      setEditingProduct(null);
      fetchAllData();
      setTimeout(() => setProductMessage(''), 3000);
    } catch (error) {
      setProductMessage('❌ ' + (error.message || 'Failed to save product'));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product permanently?')) {
      return;
    }

    try {
      await apiDelete(`/products/${productId}`);
      setAllProducts(allProducts.filter(p => p._id !== productId));
      fetchAllData();
      alert('✅ Product deleted successfully!');
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed to delete product'));
    }
  };

  // ✅ CANCEL ORDER BY ADMIN
  const handleCancelOrderByAdmin = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      await apiPut(`/orders/${orderId}/cancel`, {});
      alert('✅ Order cancelled successfully!');
      const ordersData = await apiGet('/admin/dashboard/recent-orders');
      setRecentOrders(ordersData.orders || []);
      fetchAllData();
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed to cancel order'));
    }
  };

  // ✅ MARK ORDER AS DELIVERED
  const handleMarkAsDelivered = async (orderId) => {
    if (!window.confirm('Mark this order as delivered?')) {
      return;
    }

    try {
      await apiPut(`/orders/${orderId}/status`, {
        orderStatus: 'Delivered',
        trackingNumber: 'DELIVERED_' + Date.now()
      });
      alert('✅ Order marked as Delivered!');
      const ordersData = await apiGet('/admin/dashboard/recent-orders');
      setRecentOrders(ordersData.orders || []);
      fetchAllData();
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed'));
    }
  };

  // ✅ COUPON FUNCTIONS
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponMessage('');

    const endpoint = editingCoupon ? `/coupons/${editingCoupon._id}` : '/coupons';
    const body = {
      ...couponForm,
      discountValue: parseFloat(couponForm.discountValue),
      minOrderAmount: parseFloat(couponForm.minOrderAmount) || 0,
      maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
      usageLimit: parseInt(couponForm.usageLimit) || 1
    };

    try {
      if (editingCoupon) {
        await apiPut(endpoint, body);
      } else {
        await apiPost(endpoint, body);
      }

      setCouponMessage(`✅ Coupon ${editingCoupon ? 'updated' : 'created'} successfully!`);
      setShowCouponModal(false);
      setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0', maxDiscount: '', expiryDate: '', usageLimit: '1' });
      setEditingCoupon(null);
      fetchAllData();
      setTimeout(() => setCouponMessage(''), 3000);
    } catch (error) {
      setCouponMessage('❌ ' + (error.message || 'Failed to save coupon'));
    }
  };

  const toggleCouponStatus = async (couponId, currentStatus) => {
    try {
      await apiPut(`/coupons/${couponId}/toggle`, {});
      fetchAllData();
    } catch (error) {
      alert('❌ Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon permanently?')) {
      return;
    }

    try {
      await apiDelete(`/coupons/${couponId}`);
      setCoupons(coupons.filter(c => c._id !== couponId));
      fetchAllData();
      alert('✅ Coupon deleted successfully!');
    } catch (error) {
      alert('❌ ' + (error.message || 'Failed to delete coupon'));
    }
  };

  const addImageInput = () => {
    setImageInputs([...imageInputs, '']);
  };

  const removeImageInput = (index) => {
    const newInputs = imageInputs.filter((_, i) => i !== index);
    setImageInputs(newInputs);
    const newImages = productForm.images.filter((_, i) => i !== index);
    setProductForm({...productForm, images: newImages});
  };

  const updateImageInput = (index, value) => {
    const newImages = [...productForm.images];
    newImages[index] = value;
    setProductForm({...productForm, images: newImages});
  };

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Loading Dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { overview, today, month } = stats;

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold">📊 Admin Dashboard</h1>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setProductForm({ name: '', description: '', price: '', category: '', brand: '', stock: '', images: [''], video: '' });
            setImageInputs(['']);
            setShowProductModal(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition flex items-center text-sm"
        >
          <FaPlus className="mr-2" /> Add Product
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-8">Welcome back, {user.name}! Here's what's happening.</p>

      <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'overview' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📊 Overview
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'products' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📦 Products
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'orders' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          📦 Orders
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'coupons' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🏷️ Coupons
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg transition ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          👥 Users
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-secondary">{overview.totalOrders}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FaShoppingCart className="text-blue-500 text-xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-secondary">{overview.totalUsers}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FaUsers className="text-green-500 text-xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">₹{overview.totalRevenue}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <FaRupeeSign className="text-yellow-500 text-xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-secondary">{overview.totalProducts}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FaBox className="text-purple-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">📦 Total Stock</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.totalStock || 0}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-full">
                  <FaBox className="text-indigo-500 text-xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">🏷️ Active Coupons</p>
                  <p className="text-2xl font-bold text-pink-600">{coupons.filter(c => c.isActive).length}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-full">
                  <FaTag className="text-pink-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold mb-2">📅 Today</h3>
              <div className="flex justify-between">
                <span>Orders: <strong>{today.orders}</strong></span>
                <span>Revenue: <strong className="text-primary">₹{today.revenue}</strong></span>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <h3 className="font-semibold mb-2">📆 This Month</h3>
              <div className="flex justify-between items-center">
                <div>
                  <span>Orders: <strong>{month.orders}</strong></span>
                  <span className="ml-4">Revenue: <strong className="text-primary">₹{month.revenue}</strong></span>
                </div>
                <div className={`flex items-center gap-1 ${month.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {month.revenueGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  <span className="font-semibold">{Math.abs(month.revenueGrowth)}%</span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link to="/products?filter=lowstock" className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition cursor-pointer">
              <FaExclamationTriangle className="text-yellow-500 text-2xl" />
              <div className="flex-1">
                <p className="font-medium">⚠️ Low Stock Alert</p>
                <p className="text-sm text-gray-500">{lowStockProducts.length} products low on stock</p>
              </div>
              <FaArrowRight className="text-yellow-500" />
            </Link>
            <Link to="/products?filter=outofstock" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition cursor-pointer">
              <FaTimesCircle className="text-red-500 text-2xl" />
              <div className="flex-1">
                <p className="font-medium">🚫 Out of Stock</p>
                <p className="text-sm text-gray-500">{outOfStockProducts.length} products out of stock</p>
              </div>
              <FaArrowRight className="text-red-500" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h3 className="font-semibold mb-4">📈 Last 7 Days Revenue</h3>
            <div className="flex items-end gap-2 h-40">
              {dailyData.length === 0 ? (
                <p className="text-gray-500 text-sm">No data available</p>
              ) : (
                dailyData.map((data, index) => {
                  const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/40 transition-all duration-300" style={{ height: `${Math.max(height, 5)}%` }}>
                        <div className="w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${height}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{data.date}</span>
                      <span className="text-[10px] font-medium text-primary">₹{data.revenue}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h3 className="font-semibold mb-4 flex items-center"><FaFire className="text-orange-500 mr-2" /> Top Selling Products</h3>
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-gray-400">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{product._id || 'Unknown Product'}</p>
                        <p className="text-sm text-gray-500">{product.totalSold || 0} units sold</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₹{product.totalRevenue || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <h3 className="font-semibold mb-4 flex items-center"><FaBox className="text-primary mr-2" /> Product Stock Details</h3>
            {stats.productStockList?.length === 0 ? (
              <p className="text-gray-500 text-sm">No products found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.productStockList.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{product.category}</td>
                        <td className="px-4 py-2 text-sm font-bold">{product.stock}</td>
                        <td className="px-4 py-2 text-sm">
                          {product.stock === 0 ? (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Out of Stock</span>
                          ) : product.stock <= 10 ? (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Low Stock</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">In Stock</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📦 All Products</h3>
            <button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: '', brand: '', stock: '', images: [''], video: '' }); setImageInputs(['']); setShowProductModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition flex items-center text-sm">
              <FaPlus className="mr-2" /> Add Product
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allProducts.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
                  ) : (
                    allProducts.map((product, index) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                        <td className="px-4 py-3 text-sm font-bold text-primary">₹{product.price}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${product.stock === 0 ? 'bg-red-100 text-red-800' : product.stock <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingProduct(product); setProductForm({ name: product.name || '', description: product.description || '', price: product.price || '', category: product.category || '', brand: product.brand || '', stock: product.stock || '', images: product.images?.length ? product.images : [''], video: product.video || '' }); setImageInputs(product.images?.length ? product.images : ['']); setShowProductModal(true); }} className="text-blue-500 hover:text-blue-700 transition">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteProduct(product._id)} className="text-red-500 hover:text-red-700 transition">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">📦 All Orders</h3>
            <p className="text-sm text-gray-500 mt-1">Manage orders - Cancel or Mark as Delivered</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  recentOrders.map((order, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-mono">#{order._id?.slice(-8)}</td>
                      <td className="px-6 py-3 text-sm">{order.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {order.shippingAddress ? (
                          <>
                            <p>{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                            <p className="text-xs text-primary font-medium mt-1">📞 {order.shippingAddress.phone}</p>
                          </>
                        ) : (
                          <span className="text-gray-400">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-primary">₹{order.totalPrice}</td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          order.orderStatus === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                          order.orderStatus === 'Shipped' ? 'bg-purple-100 text-purple-800' : 
                          order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' : 
                          order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered' && (
                            <>
                              <button
                                onClick={() => handleMarkAsDelivered(order._id)}
                                className="text-green-500 hover:text-green-700 transition text-xs bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg"
                              >
                                ✅ Delivered
                              </button>
                              <button
                                onClick={() => handleCancelOrderByAdmin(order._id)}
                                className="text-red-500 hover:text-red-700 transition text-xs bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg"
                              >
                                ❌ Cancel
                              </button>
                            </>
                          )}
                          {order.orderStatus === 'Delivered' && (
                            <span className="text-xs text-green-500 font-medium">✅ Delivered</span>
                          )}
                          {order.orderStatus === 'Cancelled' && (
                            <span className="text-xs text-red-500 font-medium">❌ Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🏷️ Coupons</h3>
            <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0', maxDiscount: '', expiryDate: '', usageLimit: '1' }); setShowCouponModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition flex items-center text-sm">
              <FaPlus className="mr-2" /> Create Coupon
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {coupons.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No coupons created yet</td></tr>
                  ) : (
                    coupons.map((coupon, index) => (
                      <tr key={coupon._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-bold text-primary">{coupon.code}</td>
                        <td className="px-4 py-3 text-sm">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                        <td className="px-4 py-3 text-sm">{coupon.usedCount}/{coupon.usageLimit}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleCouponStatus(coupon._id, coupon.isActive)} className={`text-2xl ${coupon.isActive ? 'text-green-500' : 'text-gray-400'} hover:scale-110 transition`}>
                              {coupon.isActive ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                            <button onClick={() => { setEditingCoupon(coupon); setCouponForm({ code: coupon.code || '', description: coupon.description || '', discountType: coupon.discountType || 'percentage', discountValue: coupon.discountValue || '', minOrderAmount: coupon.minOrderAmount || '0', maxDiscount: coupon.maxDiscount || '', expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '', usageLimit: coupon.usageLimit || '1' }); setShowCouponModal(true); }} className="text-blue-500 hover:text-blue-700 transition">
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteCoupon(coupon._id)} className="text-red-500 hover:text-red-700 transition">
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b"><h3 className="font-semibold">👥 All Users</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u, index) => (
                  <tr key={index}>
                    <td className="px-6 py-3 text-sm font-medium">{u.name}</td>
                    <td className="px-6 py-3 text-sm">{u.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {u.isEmailVerified ? <span className="text-green-500">✅ Verified</span> : <span className="text-red-500">❌ Unverified</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
            {productMessage && <div className={`mb-4 p-3 rounded-lg text-sm ${productMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{productMessage}</div>}
            <form onSubmit={handleProductSubmit} className="space-y-3">
              <input type="text" placeholder="Product Name *" value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" required />
              <textarea placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" rows="2" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Price *" value={productForm.price} onChange={(e) => setProductForm({...productForm, price: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" required />
                <input type="number" placeholder="Stock *" value={productForm.stock} onChange={(e) => setProductForm({...productForm, stock: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Category" value={productForm.category} onChange={(e) => setProductForm({...productForm, category: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Brand" value={productForm.brand} onChange={(e) => setProductForm({...productForm, brand: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FaImage className="mr-2 text-primary" /> Images (4-5 recommended)</label>
                {imageInputs.map((_, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="text" placeholder={`Image URL ${index + 1}`} value={productForm.images[index] || ''} onChange={(e) => updateImageInput(index, e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
                    {index > 0 && <button type="button" onClick={() => removeImageInput(index)} className="text-red-500 hover:text-red-700 px-2"><FaTimesCircle /></button>}
                  </div>
                ))}
                <button type="button" onClick={addImageInput} className="text-sm text-primary hover:underline flex items-center"><FaPlus className="mr-1" /> Add another image</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><FaVideo className="mr-2 text-primary" /> Video URL (Optional)</label>
                <input type="text" placeholder="YouTube/Vimeo video URL" value={productForm.video || ''} onChange={(e) => setProductForm({...productForm, video: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/80 transition">{editingProduct ? 'Update Product' : 'Add Product'}</button>
                <button type="button" onClick={() => { setShowProductModal(false); setEditingProduct(null); setProductMessage(''); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCouponModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{editingCoupon ? '✏️ Edit Coupon' : '➕ Create New Coupon'}</h3>
            {couponMessage && <div className={`mb-4 p-3 rounded-lg text-sm ${couponMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{couponMessage}</div>}
            <form onSubmit={handleCouponSubmit} className="space-y-3">
              <input type="text" placeholder="Coupon Code *" value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary uppercase" required />
              <input type="text" placeholder="Description" value={couponForm.description} onChange={(e) => setCouponForm({...couponForm, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              <select value={couponForm.discountType} onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
              <input type="number" placeholder="Discount Value *" value={couponForm.discountValue} onChange={(e) => setCouponForm({...couponForm, discountValue: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" required />
              <input type="number" placeholder="Min Order Amount (₹)" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm({...couponForm, minOrderAmount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              <input type="number" placeholder="Max Discount (₹)" value={couponForm.maxDiscount} onChange={(e) => setCouponForm({...couponForm, maxDiscount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              <input type="date" placeholder="Expiry Date" value={couponForm.expiryDate} onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" required />
              <input type="number" placeholder="Usage Limit" value={couponForm.usageLimit} onChange={(e) => setCouponForm({...couponForm, usageLimit: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary" />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/80 transition">{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</button>
                <button type="button" onClick={() => { setShowCouponModal(false); setEditingCoupon(null); setCouponMessage(''); }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;