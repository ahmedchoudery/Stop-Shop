/**
 * @fileoverview Central type definitions for Stop & Shop
 * Applies: typescript-expert (branded types, discriminated unions, interfaces)
 */

// ─────────────────────────────────────────────────────────────────
// BRANDED TYPES — Prevent primitive obsession
// ─────────────────────────────────────────────────────────────────

type Brand<K, T> = K & { readonly __brand: T };

export type OrderId = Brand<string, 'OrderId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type AdminId = Brand<string, 'AdminId'>;
export type UserId = Brand<string, 'UserId'>;
export type PriceUSD = Brand<number, 'PriceUSD'>;
export type PricePKR = Brand<number, 'PricePKR'>;
export type Quantity = Brand<number, 'Quantity'>;

// ─────────────────────────────────────────────────────────────────
// DOMAIN ENUMS
// ─────────────────────────────────────────────────────────────────

export const OrderStatus = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const AdminRole = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin',
  AUDITOR: 'auditor',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const MediaType = {
  UPLOAD: 'upload',
  URL: 'url',
  EMBED: 'embed',
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export const ProductBucket = {
  TOPS: 'Tops',
  BOTTOMS: 'Bottoms',
  FOOTWEAR: 'Footwear',
  ACCESSORIES: 'Accessories',
} as const;
export type ProductBucket = (typeof ProductBucket)[keyof typeof ProductBucket];

export const CurrencyCode = {
  USD: 'USD',
  PKR: 'PKR',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;
export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

// ─────────────────────────────────────────────────────────────────
// CORE DOMAIN INTERFACES
// ─────────────────────────────────────────────────────────────────

export interface Customer {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
}

export interface OrderItem {
  id: ProductId;
  name: string;
  price: PriceUSD;
  quantity: Quantity;
  selectedSize?: string;
}

export interface Order {
  _id: string;
  orderID: OrderId;
  customer: Customer;
  items: OrderItem[];
  total: PriceUSD;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
}

export interface SizeStockMap {
  [size: string]: number;
}

export interface Product {
  _id?: string;
  id: ProductId;
  name: string;
  price: PriceUSD;
  quantity: Quantity;
  stock: Quantity;
  image: string;
  mediaType: MediaType;
  embedCode: string;
  rating: 1 | 2 | 3 | 4 | 5;
  bucket: ProductBucket;
  subCategory: string;
  specs: string[];
  colors: string[];
  sizes: string[];
  sizeStock: SizeStockMap;
  lifestyleImage: string;
  variantImages: Record<string, string>;
  gallery: string[];
  createdAt?: string;
}

export interface Admin {
  _id: AdminId;
  name: string;
  email: string;
  isPrimary: boolean;
  roles: AdminRole[];
  failedLoginAttempts: number;
  lockUntil: string | null;
  lastLogin: string | null;
  createdAt: string;
}

export interface StoreSettings {
  _id?: string;
  logo: string;
  announcement: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────────
// API RESPONSE TYPES — Discriminated unions for type safety
// ─────────────────────────────────────────────────────────────────

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode: number };

export interface LoginResponse {
  name: string;
  success: boolean;
  token: string;
}

export interface RevenueStats {
  totalRevenue: PricePKR;
  trend: number;
  weeklyData: WeeklyDataPoint[];
  cached?: boolean;
}

export interface WeeklyDataPoint {
  day: string;
  revenue: number;
  orders: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  cached?: boolean;
}

export interface InventoryStats {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  products: Product[];
  cached?: boolean;
}

export interface CheckoutPayload {
  customer: Customer;
  items: OrderItem[];
  total: PriceUSD;
  paymentMethod: string;
}

export interface CheckoutResponse {
  message: string;
  orderID: OrderId;
}

// ─────────────────────────────────────────────────────────────────
// CART & WISHLIST TYPES
// ─────────────────────────────────────────────────────────────────

export interface CartItem extends Omit<Product, 'quantity'> {
  cartId: number;
  quantity: Quantity;
  activeColor?: string;
  selectedSize?: string;
}

export type DrawerMode = 'cart' | 'product' | 'wishlist';

// ─────────────────────────────────────────────────────────────────
// FORM TYPES
// ─────────────────────────────────────────────────────────────────

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
  paymentMethod: 'credit-card' | 'bank-transfer' | 'cod';
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface ProductFormData {
  id: string;
  name: string;
  price: string | number;
  quantity: string | number;
  image: string;
  lifestyleImage: string;
  mediaType: MediaType;
  embedCode: string;
  gallery: string[];
  bucket: ProductBucket;
  subCategory: string;
  rating: 1 | 2 | 3 | 4 | 5;
  stock: number;
  specs: [string, string, string];
  colors: string[];
  variantImages: Record<string, string>;
  sizes: string[];
  sizeStock: SizeStockMap;
}

// ─────────────────────────────────────────────────────────────────
// UI STATE TYPES
// ─────────────────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type SortOption = 'featured' | 'popular' | 'price-high' | 'price-low';
export type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
export type LocaleCode = 'en-US' | 'ur-PK';

// ─────────────────────────────────────────────────────────────────
// CURRENCY CONFIG TYPE
// ─────────────────────────────────────────────────────────────────

export interface CurrencyConfig {
  symbol: string;
  rate: number;
  label: CurrencyCode;
}

export type CurrencyMap = Record<CurrencyCode, CurrencyConfig>;

// ─────────────────────────────────────────────────────────────────
// AUDIT LOG TYPE
// ─────────────────────────────────────────────────────────────────

export interface AuditLog {
  _id: string;
  action: string;
  adminId: AdminId;
  adminEmail?: string;
  details: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────
// PROMO CODE TYPE
// ─────────────────────────────────────────────────────────────────

export interface PromoCode {
  code: string;
  discount: number;
  label: string;
}

// ─────────────────────────────────────────────────────────────────
// JWT PAYLOAD TYPE
// ─────────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: AdminId;
  email: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

export interface CsrfPayload {
  type: 'csrf';
  userId: AdminId;
  iat?: number;
  exp?: number;
}