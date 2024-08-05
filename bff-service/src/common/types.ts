export interface Product {
  id: string;
  price: number;
  count: number;
  title: string;
  description: string;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  status: CartStatuses;
  items: CartItem[];
}

export enum CartStatuses {
  OPEN = 'OPEN',
  ORDERED = 'ORDERED',
}

export interface CartItem {
  id: string;
  cartId: string;
  product: Product;
  count: number;
}
