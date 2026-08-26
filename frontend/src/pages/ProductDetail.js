import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaArrowLeft, FaTimes, FaExpand, FaUser } from 'react-icons/fa';
import { useCart } from '../context/CartContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Review States
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = () => {
    fetch(`http://localhost:5000/api/products/${id}`)
      .then(res => res.json())
      .then(data => { 
        setProduct(data.product); 
        setReviews(data.product?.reviews || []);
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setReviewLoading(true);
    setReviewMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await res.json();
      if (res.ok) {
        setReviewMessage('Review added successfully!');
        setReviewComment('');
        setReviewRating(5);
        fetchProduct();
        setTimeout(() => setReviewMessage(''), 3000);
      } else {
        setReviewMessage('❌ ' + (data.message || 'Failed to add review'));
      }
    } catch (error) {
      setReviewMessage(' Server error. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage(' Please login first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setAdding(true);
    setMessage('');
    
    const success = await addToCart(id, quantity);
    
    if (success) {
      setMessage(' Added to cart successfully!');
      window.dispatchEvent(new Event('cartUpdated'));
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(' Failed to add to cart');
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-2 text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center pt-24">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Link to="/products" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Products
        </Link>
      </div>
    );
  }

  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < Math.floor(rating)) stars.push(<FaStar key={i} className="text-yellow-500" />);
      else if (i < Math.ceil(rating)) stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-500" />);
    }
    return stars;
  };

  const renderStarsStatic = (rating = 0) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) stars.push(<FaStar key={i} className="text-yellow-500 text-sm" />);
      else stars.push(<FaRegStar key={i} className="text-yellow-500 text-sm" />);
    }
    return stars;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('embed')) return url;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('drive.google.com')) {
      const fileId = url.split('file/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const videoEmbedUrl = getEmbedUrl(product.video);

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-primary transition mb-4"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Section */}
          <div className="md:w-1/2">
            <div 
              className="relative cursor-pointer group overflow-hidden rounded-lg"
              onClick={() => setIsFullscreen(true)}
            >
              <img
                src={product.images?.[selectedImage] || 'https://via.placeholder.com/500x400?text=No+Image'}
                alt={product.name}
                className="w-full object-cover rounded-lg h-72 md:h-80"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <FaExpand className="text-xl text-gray-700" />
                </div>
              </div>
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    } hover:border-primary transition`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {videoEmbedUrl && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">📹 Product Video</h3>
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`${videoEmbedUrl}?autoplay=0&mute=0`}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Product Video"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600 text-sm md:text-base">{product.description}</p>
            
            <div className="flex items-center space-x-2">
              <span className="flex">{renderStars(product.ratings || 0)}</span>
              <span className="text-gray-500 text-sm">({product.numReviews || 0} reviews)</span>
            </div>

            <p className="text-3xl font-bold text-primary">₹{product.price}</p>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="px-4 py-2 min-w-[50px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 md:flex-none flex items-center justify-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
              >
                <FaShoppingCart className="mr-2" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p><span className="font-medium">Category:</span> {product.category}</p>
              <p><span className="font-medium">Brand:</span> {product.brand}</p>
              <p><span className="font-medium">Stock:</span> {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}</p>
            </div>
          </div>
        </div>
      </div>

      {/*  REVIEWS SECTION */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mt-8">
        <h2 className="text-2xl font-bold mb-6"> Customer Reviews</h2>

        {/*  Add Review Form */}
        {localStorage.getItem('token') ? (
          <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold mb-3">Write a Review</h3>
            {reviewMessage && (
              <div className={`mb-3 p-2 rounded-lg text-sm ${reviewMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {reviewMessage}
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="text-2xl focus:outline-none"
                >
                  {star <= reviewRating ? (
                    <FaStar className="text-yellow-500" />
                  ) : (
                    <FaRegStar className="text-gray-300" />
                  )}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Write your review here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
              rows="3"
              required
            />
            <button
              type="submit"
              disabled={reviewLoading}
              className="mt-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition disabled:opacity-50"
            >
              {reviewLoading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <p className="text-gray-500 text-sm mb-6">
            <Link to="/login" className="text-primary hover:underline">Login</Link> to write a review
          </p>
        )}

        {/*  Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <FaUser className="text-gray-400" />
                  <span className="font-medium">{review.name || 'Anonymous'}</span>
                  <span className="flex ml-2">{renderStarsStatic(review.rating)}</span>
                </div>
                <p className="text-gray-600 text-sm">{review.comment}</p>
                <p className="text-gray-400 text-xs mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-primary transition z-10"
          >
            <FaTimes />
          </button>
          
          <div className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={product.images?.[selectedImage] || 'https://via.placeholder.com/600x400?text=No+Image'}
              alt={product.name}
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {product.images?.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex gap-3 justify-center">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-white/30'
                  } hover:border-primary transition`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;