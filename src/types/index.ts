/**
 * @fileoverview Stop-Shop Strict Type Definitions
 * Applies: javascript-typescript-typescript-scaffold (type safety, architectural design)
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  mediaType?: 'url' | 'embed';
  embedCode?: string;
  rating?: number;
  bucket?: string;
  subCategory?: string;
  specs?: string[];
  colors?: string[];
  sizes?: string[];
  sizeStock?: Record<string, number>;
  lifestyleImage?: string;
  variantImages?: Record<string, string>;
  gallery?: string[];
  discount?: number;
}

export interface CartItem extends Product {
  selectedSize: string;
  selectedColor: string;
  cartId?: number;
  activeColor?: string;
}

export interface Customer {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
}

export interface Order {
  _id?: string;
  id?: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  paymentMethod: 'COD' | 'ATM Card' | 'Bank Transfer' | 'Easypaisa' | 'JazzCash';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt?: string;
}

export interface Coupon {
  _id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface Review {
  _id?: string;
  customerName: string;
  customerEmail: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface SystemSettings {
  logo?: string;
  announcement?: string;
}

export interface StageNodeData extends Record<string, unknown> {
  title: string;
  icon: any;
  color: string;
  bg: string;
  description: string;
  metricName: string;
  processTime: string;
  system: string;
}

export interface FulfillmentFlowData {
  ordersByStatus: Record<string, number>;
}