import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter, FaTimes, FaShoppingCart, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Products = () => {
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState(''); 

  useEffect(() => {
    //  Check URL params for filter
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter === 'lowstock') {
      setFilterType('lowstock');
    } else if (filter === 'outofstock') {
      setFilterType('outofstock');
    }
  }, [location]);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        const allProducts = data.products || [];
        setProducts(allProducts);
        
        // Apply filter if coming from dashboard
        let filteredResult = allProducts;
        if (filterType === 'lowstock') {
          filteredResult = allProducts.filter(p => p.stock > 0 && p.stock <= 10);
        } else if (filterType === 'outofstock') {
          filteredResult = allProducts.filter(p => p.stock === 0);
        }
        
        setFiltered(filteredResult);
        const cats = [...new Set(allProducts.map(p => p.category))];
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterType]);

  //  Apply filters when search/category/price changes
  useEffect(() => {
    let result = [...products];
    
    // Apply stock filter first
    if (filterType === 'lowstock') {
      result = result.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (filterType === 'outofstock') {
      result = result.filter(p => p.stock === 0);
    }
    
    if (search) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category) {
      result = result.filter(p => p.category === category);
    }
    if (priceRange.min) {
      result = result.filter(p => p.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      result = result.filter(p => p.price <= parseFloat(priceRange.max));
    }
    setFiltered(result);
  }, [search, category, priceRange, products, filterType]);

  const clearFilters = () => { 
    setSearch(''); 
    setCategory(''); 
    setPriceRange({ min: '', max: '' });
    setFilterType('');
  };

  // Get filter badge text
  const getFilterBadge = () => {
    if (filterType === 'lowstock') return '🔶 Low Stock';
    if (filterType === 'outofstock') return '🔴 Out of Stock';
    return '';
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) stars.push(<FaStar key={i} className="text-yellow-500 text-sm" />);
      else if (i < Math.ceil(rating)) stars.push(<FaStarHalfAlt key={i} className="text-yellow-500 text-sm" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-500 text-sm" />);
    }
    return stars;
  };

  return (
    <div className="pt-24 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-secondary">
            Our <span className="text-primary">Products</span>
          </h1>
          <p className="text-gray-500 mt-2">Find the perfect electronics for your needs</p>
          
          {/*  Filter Badge */}
          {getFilterBadge() && (
            <div className="mt-3 inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
              <span>{getFilterBadge()}</span>
              <button 
                onClick={() => { setFilterType(''); clearFilters(); }}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center bg-white px-6 py-4 rounded-2xl border border-gray-200 hover:border-primary transition"
          >
            <FaFilter className="mr-2 text-primary" />
            Filters
            {(category || priceRange.min || priceRange.max || filterType) && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[category, priceRange.min, priceRange.max, filterType].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-primary transition">
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button onClick={clearFilters} className="mt-4 text-primary hover:underline text-sm font-medium">
              Clear all filters
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-gray-500 text-sm mb-6">
          Showing <span className="font-semibold text-secondary">{filtered.length}</span> of <span className="font-semibold text-secondary">{products.length}</span> products
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500 text-lg">No products found</p>
            <button onClick={clearFilters} className="text-primary hover:underline mt-2 font-medium">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <Link key={p._id} to={`/product/${p._id}`} className="card card-hover group">
                <div className="relative overflow-hidden">
                  <img
                    src={p.images?.[0] || 'https://via.placeholder.com/400x300?text=Royal+Electronics'}
                    alt={p.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Stock Badge */}
                  {p.stock === 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Out of Stock
                    </div>
                  )}
                  {p.stock > 0 && p.stock <= 10 && (
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Low Stock ({p.stock})
                    </div>
                  )}
                  {p.stock > 10 && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      In Stock
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex mb-2">{renderStars(p.ratings || 0)}</div>
                  <h3 className="font-semibold text-secondary text-lg line-clamp-1">{p.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mt-1">{p.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-2xl font-bold text-primary">₹{p.price}</span>
                    <button className={`p-2 rounded-full transition-all duration-300 ${p.stock === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
                      <FaShoppingCart />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;