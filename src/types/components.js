@ts-nocheck

/**
 * @typedef {Object} ProductCardProps
 * @property {import('./api').Product | import('./api').CartItem} product
 * @property {function} [onAddToCart]
 * @property {function} [onToggleWishlist]
 * @property {boolean} [isInWishlist]
 * @property {function} [onSelectSize]
 */

/**
 * @typedef {Object} OrderTableProps
 * @property {import('./api').Order[]} orders
 * @property {function} [onStatusChange]
 */

/**
 * @typedef {Object} InventoryTableProps
 * @property {import('./api').Product[]} products
 * @property {function} [onStockUpdate]
 */

/**
 * @typedef {Object} StatsGridProps
 * @property {number} [totalRevenue]
 * @property {number} [totalOrders]
 * @property {number} [pendingOrders]
 * @property {number} [totalProducts]
 * @property {number} [outOfStock]
 * @property {number} [lowStock]
 */

/**
 * @typedef {Object} RevenueChartProps
 * @property {Array<{day: string, revenue: number, orders: number}>} data
 */

/**
 * @typedef {'xs' | 'sm' | 'md' | 'lg' | 'xl'} ButtonSize
 * @typedef {'primary' | 'secondary' | 'danger' | 'ghost'} ButtonVariant

/**
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} children
 * @property {function} [onClick]
 * @property {ButtonVariant} [variant]
 * @property {ButtonSize} [size]
 * @property {boolean} [disabled]
 * @property {string} [className]
 * @property {'button' | 'submit' | 'reset'} [type]
 */

/**
 * @typedef {Object} InputProps
 * @property {string} [value]
 * @property {function} [onChange]
 * @property {string} [placeholder]
 * @property {string} [type]
 * @property {string} [name]
 * @property {string} [id]
 * @property {boolean} [disabled]
 * @property {string} [className]
 * @property {string} [error]
 */

/**
 * @typedef {Object} SelectProps
 * @property {string} [value]
 * @property {function} [onChange]
 * @property {Array<{value: string, label: string}>} options
 * @property {string} [name]
 * @property {string} [className]
 */

/**
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastType

/**
 * @typedef {Object} Toast
 * @property {string} id
 * @property {ToastType} type
 * @property {string} message
 */

/**
 * @typedef {Object} ToastContextValue
 * @property {function} showToast
 */

export {};
