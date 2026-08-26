import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback
} from 'react';

const CartContext = createContext();


export const CartProvider = ({ children }) => {

  const [cart, setCart] = useState({
    items: [],
    totalPrice: 0
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);


  // =====================================================
  // FETCH CART
  // =====================================================

  const fetchCart = useCallback(
    async () => {

      const token =
        localStorage.getItem('token');


      if (!token) {

        setCart({
          items: [],
          totalPrice: 0
        });

        setLoading(false);

        return;
      }


      try {

        setLoading(true);


        const res = await fetch(
          'http://localhost:5000/api/cart',
          {
            headers: {
              'Authorization':
                `Bearer ${token}`
            }
          }
        );


        if (!res.ok) {

          throw new Error(
            'Failed to fetch cart'
          );
        }


        const data =
          await res.json();


        setCart(
          data.cart || {
            items: [],
            totalPrice: 0
          }
        );


        setError(null);


      } catch (error) {

        console.error(
          'Error fetching cart:',
          error
        );


        setError(
          error.message
        );


        setCart({
          items: [],
          totalPrice: 0
        });


      } finally {

        setLoading(false);

      }

    },
    []
  );


  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {

    fetchCart();

  }, [fetchCart]);


  // =====================================================
  // AUTH CHANGE
  // =====================================================

  useEffect(() => {

    const handleAuthChange =
      () => {

        fetchCart();

      };


    window.addEventListener(
      'authChange',
      handleAuthChange
    );


    window.addEventListener(
      'storage',
      handleAuthChange
    );


    return () => {

      window.removeEventListener(
        'authChange',
        handleAuthChange
      );


      window.removeEventListener(
        'storage',
        handleAuthChange
      );

    };

  }, [fetchCart]);


  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart =
    async (
      productId,
      quantity = 1
    ) => {

      const token =
        localStorage.getItem('token');


      if (!token) {

        alert(
          'Please login first'
        );

        return false;
      }


      try {

        const res = await fetch(
          'http://localhost:5000/api/cart',
          {
            method: 'POST',

            headers: {

              'Content-Type':
                'application/json',

              'Authorization':
                `Bearer ${token}`

            },

            body: JSON.stringify({
              productId,
              quantity
            })

          }
        );


        if (res.ok) {

          await fetchCart();


          window.dispatchEvent(
            new Event('cartUpdated')
          );


          return true;

        } else {

          const data =
            await res.json();


          alert(
            data.message ||
            'Failed to add to cart'
          );


          return false;
        }


      } catch (error) {

        console.error(
          'Error adding to cart:',
          error
        );


        alert(
          'Server error'
        );


        return false;
      }

    };


  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity =
    async (
      productId,
      quantity
    ) => {

      if (quantity < 1)
        return;


      const token =
        localStorage.getItem('token');


      try {

        const res = await fetch(
          `http://localhost:5000/api/cart/${productId}`,
          {
            method: 'PUT',

            headers: {

              'Content-Type':
                'application/json',

              'Authorization':
                `Bearer ${token}`

            },

            body: JSON.stringify({
              quantity
            })

          }
        );


        if (res.ok) {

          await fetchCart();


          window.dispatchEvent(
            new Event('cartUpdated')
          );

        }

      } catch (error) {

        console.error(
          'Error updating cart:',
          error
        );

      }

    };


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem =
    async (
      productId
    ) => {

      const token =
        localStorage.getItem('token');


      try {

        const res = await fetch(
          `http://localhost:5000/api/cart/${productId}`,
          {
            method: 'DELETE',

            headers: {
              'Authorization':
                `Bearer ${token}`
            }

          }
        );


        if (res.ok) {

          await fetchCart();


          window.dispatchEvent(
            new Event('cartUpdated')
          );

        }

      } catch (error) {

        console.error(
          'Error removing item:',
          error
        );

      }

    };


  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart =
    async () => {

      const token =
        localStorage.getItem('token');


      try {

        const res = await fetch(
          'http://localhost:5000/api/cart',
          {
            method: 'DELETE',

            headers: {
              'Authorization':
                `Bearer ${token}`
            }

          }
        );


        if (res.ok) {

          await fetchCart();


          window.dispatchEvent(
            new Event('cartUpdated')
          );

        }

      } catch (error) {

        console.error(
          'Error clearing cart:',
          error
        );

      }

    };


  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems =
    cart?.items?.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    ) || 0;


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

  const context =
    useContext(CartContext);


  if (!context) {

    throw new Error(
      'useCart must be used within a CartProvider'
    );

  }


  return context;

};