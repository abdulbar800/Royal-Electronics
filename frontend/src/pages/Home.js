import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaArrowRight } from 'react-icons/fa';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-secondary to-dark text-white py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to <span className="text-primary">Royal Electronics</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Discover the latest gadgets at unbeatable prices.
          </p>
          <Link to="/products" className="bg-primary px-6 md:px-8 py-3 rounded-lg hover:bg-primary/80 transition inline-block">
            Shop Now <FaArrowRight className="inline ml-2" />
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Featured Products</h2>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {products.slice(0, 4).map((p) => (
                <Link key={p._id} to={`/product/${p._id}`} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
                  <img src={p.images?.[0] || 'https://via.placeholder.com/300'} alt={p.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-primary font-bold">₹{p.price}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;