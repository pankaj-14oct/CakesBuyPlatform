import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Cake, Addon } from '@shared/schema';

export interface CartItem {
  id: number;
  cake: Cake;
  quantity: number;
  weight: string;
  flavor: string;
  customMessage?: string;
  customImage?: string;
  imagePosition?: { x: number; y: number };
  textPosition?: { x: number; y: number };
  imageSize?: number;
  photoCustomization?: {
    uploadedImage?: string;
    customText?: string;
    imagePosition?: { x: number; y: number };
    textPosition?: { x: number; y: number };
    imageSize?: number;
  };
  price: number;
  addons: Array<{
    addon: Addon;
    quantity: number;
  }>;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'UPDATE_ITEM'; payload: { id: number; updates: Partial<CartItem> } }
  | { type: 'ADD_ADDON'; payload: { itemId: number; addon: Addon; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => 
        item.cake.id === action.payload.cake.id &&
        item.weight === action.payload.weight &&
        item.flavor === action.payload.flavor
      );

      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
      } else {
        newItems = [...state.items, { ...action.payload, id: Date.now() }];
      }

      const total = calculateTotal(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const total = calculateTotal(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);

      const total = calculateTotal(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.updates }
          : item
      );

      const total = calculateTotal(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'ADD_ADDON': {
      const newItems = state.items.map(item => {
        if (item.id === action.payload.itemId) {
          const existingAddonIndex = item.addons.findIndex(
            a => a.addon.id === action.payload.addon.id
          );

          if (existingAddonIndex > -1) {
            // Update existing addon quantity
            const updatedAddons = [...item.addons];
            updatedAddons[existingAddonIndex].quantity += action.payload.quantity;
            return { ...item, addons: updatedAddons };
          } else {
            // Add new addon
            return {
              ...item,
              addons: [...item.addons, { addon: action.payload.addon, quantity: action.payload.quantity }]
            };
          }
        }
        return item;
      });

      const total = calculateTotal(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

      return { items: newItems, total, itemCount };
    }

    case 'CLEAR_CART':
      localStorage.removeItem(CART_STORAGE_KEY);
      return { items: [], total: 0, itemCount: 0 };

    case 'LOAD_CART':
      return action.payload;

    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const addonsTotal = item.addons.reduce((addonSum, addon) => 
      addonSum + (parseFloat(addon.addon.price) * addon.quantity), 0
    );
    return sum + itemTotal + addonsTotal;
  }, 0);
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  clearCart: () => void;
} | null>(null);

// Helper functions for localStorage
const CART_STORAGE_KEY = 'cakesbuy_cart';

const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const loadCartFromStorage = (): CartState => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the structure to ensure it's still valid
      if (parsed && Array.isArray(parsed.items)) {
        return {
          items: parsed.items,
          total: parsed.total || calculateTotal(parsed.items),
          itemCount: parsed.itemCount || parsed.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)
        };
      }
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }
  return { items: [], total: 0, itemCount: 0 };
};

// Enhanced reducer that saves to localStorage
const persistentCartReducer = (state: CartState, action: CartAction): CartState => {
  const newState = cartReducer(state, action);
  saveCartToStorage(newState);
  return newState;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(persistentCartReducer, { items: [], total: 0, itemCount: 0 }, loadCartFromStorage);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveCartToStorage(state);
  }, [state]);

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, dispatch, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
