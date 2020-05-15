import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

export interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const result = await AsyncStorage.getItem('@GoMarket:products');
      if (result) {
        setProducts([...JSON.parse(result)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newCart = products.map(inCartProduct => {
        if (inCartProduct.id === id) {
          return { ...inCartProduct, quantity: inCartProduct.quantity + 1 };
        }
        return inCartProduct;
      });
      setProducts(newCart);

      await AsyncStorage.setItem('@GoMarket:products', JSON.stringify(newCart));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const inCart = products.find(
        inCartProduct => inCartProduct.id === product.id,
      );

      if (inCart) {
        return increment(inCart.id);
      }

      setProducts([...products, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const newCart = products.map(inCartProduct => {
        if (inCartProduct.id === id) {
          return { ...inCartProduct, quantity: inCartProduct.quantity - 1 };
        }
        return inCartProduct;
      });

      const filtered = newCart.filter(item => item.quantity > 0);

      setProducts(filtered);

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(filtered),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
