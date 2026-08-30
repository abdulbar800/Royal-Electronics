import React from 'react';
import { 
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, 
  FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope 
} from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Royal <span className="text-primary">Electronics</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your one-stop shop for all electronics. Quality products at affordable prices with excellent customer service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/products" className="hover:text-primary transition">Products</a></li>
              <li><a href="/" className="hover:text-primary transition">About Us</a></li>
              <li><a href="/" className="hover:text-primary transition">Contact</a></li>
              <li><a href="/" className="hover:text-primary transition">FAQs</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Contact Us</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-center"><FaMapMarkerAlt className="mr-2 text-primary" /> 123 Street, New Delhi</li>
              <li className="flex items-center"><FaPhone className="mr-2 text-primary" /> +91 99999 99999</li>
              <li className="flex items-center"><FaEnvelope className="mr-2 text-primary" /> info@royalelectronics.com</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Follow Us</h4>
            <div className="flex space-x-4 text-2xl">
              <a href="#" className="hover:text-primary transition"><FaFacebook /></a>
              <a href="#" className="hover:text-primary transition"><FaTwitter /></a>
              <a href="#" className="hover:text-primary transition"><FaInstagram /></a>
              <a href="#" className="hover:text-primary transition"><FaLinkedin /></a>
              <a href="#" className="hover:text-primary transition"><FaYoutube /></a>
            </div>
            <p className="text-gray-500 text-sm mt-4">Subscribe to our newsletter</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 pb-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Royal Electronics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;