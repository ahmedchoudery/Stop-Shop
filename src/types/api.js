@ts-nocheck

/**
 * @typedef {Object} Customer
 * @property {string} name
 * @property {string} email
 * @property {string} address
 * @property {string} city
 * @property {string} zip
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {string} [selectedSize]
 */

/**
 * @typedef {'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'} OrderStatus
 */

/**
 * @typedef {Object} Order
 * @property {string} [_id]
 * @property {string} orderID
 * @property {Customer} customer
 * @property {OrderItem[]} items
 * @property {number} total
 * @property {string} paymentMethod
 * @property {OrderStatus} status
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} SizeStock
 * @property {[key: string]: number}
 */

/**
 * @typedef {'upload' | 'url' | 'embed'} MediaType
 * @typedef {'admin' | 'super-admin' | 'auditor'} AdminRole
 */

/**
 * @typedef {Object} Product
 * @property {string} [_id]
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} stock
 * @property {string} image
 * @property {MediaType} [mediaType]
 * @property {string} [embedCode]
 * @property {number} [rating]
 * @property {string} bucket
 * @property {string} [subCategory]
 * @property {string[]} [specs]
 * @property {string[]} [colors]
 * @property {string[]} [sizes]
 * @property {SizeStock} [sizeStock]
 * @property {string} [lifestyleImage]
 * @property {Object.<string, string>} [variantImages]
 * @property {string[]} [gallery]
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Admin
 * @property {string} [_id]
 * @property {string} name
 * @property {string} email
 * @property {string} [password]
 * @property {boolean} [isPrimary]
 * @property {AdminRole[]} [roles]
 * @property {number} [failedLoginAttempts]
 * @property {Date | null} [lockUntil]
 * @property {Date | null} [lastLogin]
 * @property {Date} createdAt
 */

/**
 * @typedef {Object} Settings
 * @property {string} [_id]
 * @property {string} logo
 * @property {string} announcement
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} [token]
 * @property {string} [name]
 * @property {string} [error]
 */

/**
 * @typedef {Object} HealthResponse
 * @property {string} status
 * @property {string} timestamp
 * @property {'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown'} database
 * @property {number} uptime
 */

/**
 * @typedef {Object} RevenueStats
 * @property {number} totalRevenue
 * @property {number} trend
 * @property {Array<{day: string, revenue: number, orders: number}>} weeklyData
 * @property {boolean} [cached]
 */

/**
 * @typedef {Object} OrderStats
 * @property {number} totalOrders
 * @property {number} pendingOrders
 * @property {boolean} [cached]
 */

/**
 * @typedef {Object} InventoryStats
 * @property {number} totalProducts
 * @property {number} outOfStock
 * @property {number} lowStock
 * @property {Product[]} [products]
 * @property {boolean} [cached]
 */

/**
 * @typedef {Object} ApiError
 * @property {string} error
 */

/**
 * @typedef {Object} CheckoutRequest
 * @property {Customer} customer
 * @property {OrderItem[]} items
 * @property {number} total
 * @property {string} paymentMethod
 */

/**
 * @typedef {Object} CheckoutResponse
 * @property {string} [message]
 * @property {string} [orderID]
 * @property {string} [error]
 */

/**
 * @typedef {Object} CreateProductRequest
 * @property {string} [id]
 * @property {string} name
 * @property {number} price
 * @property {number} [quantity]
 * @property {number} [stock]
 * @property {string} image
 * @property {MediaType} [mediaType]
 * @property {string} [embedCode]
 * @property {number} [rating]
 * @property {string} [bucket]
 * @property {string} [subCategory]
 * @property {string[]} [specs]
 * @property {string[]} [colors]
 * @property {string[]} [sizes]
 * @property {SizeStock} [sizeStock]
 * @property {string} [lifestyleImage]
 * @property {string[]} [gallery]
 */

/**
 * @typedef {Object} JwtPayload
 * @property {string} id
 * @property {string} email
 * @property {AdminRole} role
 */

/**
 * @typedef {'en' | 'ur'} Locale
 * @typedef {'USD' | 'PKR' | 'EUR' | 'GBP'} Currency
 */

/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {string} [selectedSize]
 * @property {string} [image]
 */

/**
 * @typedef {Object} CartState
 * @property {CartItem[]} items
 * @property {number} total
 * @property {function} addToCart
 * @property {function} removeFromCart
 * @property {function} updateQuantity
 * @property {function} clearCart
 */

/**
 * @typedef {Object} WishlistItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string} image
 */

/**
 * @typedef {Object} WishlistState
 * @property {WishlistItem[]} items
 * @property {function} addToWishlist
 * @property {function} removeFromWishlist
 * @property {function} isInWishlist
 */

/**
 * @typedef {Object} SchemaOrgProduct
 * @property {'Product'} @type
 * @property {string} name
 * @property {string} description
 * @property {string} image
 * @property {string} url
 * @property {{'@type': 'Brand', name: string}} brand
 * @property {{'@type': 'Offer', price: number, priceCurrency: string, availability: string}} offers
 */

/**
 * @typedef {Object} SchemaOrgResponse
 * @property {'https://schema.org'} @context
 * @property {'ItemList'} @type
 * @property {Array<{'@type': 'ListItem', position: number, item: SchemaOrgProduct}>} itemListElement
 */

export {};
