export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Order {
  customer: any;
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  phone: string;
  notes?: string;
  subtotal: number;
  tax: number;
  discount: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  items: OrderItem[];
}

export interface OrderContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchAllOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  fetchOrderByNumber: (orderNumber: string) => Promise<Order | null>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}
