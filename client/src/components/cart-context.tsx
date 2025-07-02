import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Cake, Addon } from '@shared/schema';

export interface CartItem {
  id: number;
  cake: Cake;
  quantity: number;
  weight: string;
  flavor: string;
  customMessage?: string;
  customImage?: string;
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
  | { type: 'CLEAR_CART' };

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
      return { items: [], total: 0, itemCount: 0 };

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
} | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
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
