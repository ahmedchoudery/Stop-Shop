import React, { useState, useEffect } from 'react';
import CheckoutForm from '../components/CheckoutForm';
import OrderSuccessPage from './OrderSuccessPage';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../config/api';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { useCurrency } from '../context/CurrencyContext';

const CheckoutPage = () => {
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [stockWarnings, setStockWarnings] = useState([]);
  const { cartItems, total, openDrawer } = useCart();
  const { t } = useLocale();
  const { currency } = useCurrency();

  useEffect(() => {
    const checkStock = async () => {
      const warnings = [];
      for (const item of cartItems) {
        try {
          const res = await fetch(apiUrl(`/api/products/${item.id}`));
          if (res.ok) {
            const product = await res.json();
            const qty = item.quantity || 1;
            if (product.sizeStock && item.selectedSize) {
              const sizeStock = product.sizeStock.get ? product.sizeStock.get(item.selectedSize) : product.sizeStock[item.selectedSize];
              if (sizeStock !== undefined && sizeStock < qty) {
                warnings.push(`Only ${sizeStock} left of "${item.name}" (Size: ${item.selectedSize})`);
              }
            } else if (product.stock !== undefined && product.stock < qty) {
              warnings.push(`Only ${product.stock} left of "${item.name}"`);
            }
          }
        } catch (err) {
          // Silently fail stock check
        }
      }
      setStockWarnings(warnings);
    };

    if (cartItems.length > 0) {
      checkStock();
    }
  }, [cartItems]);

  const handleOrderComplete = async (formData) => {
    try {
      const orderPayload = {
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zip: formData.zip,
        },
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize,
        })),
        total: formData.finalTotal || total,
        currency: currency,
        paymentMethod: formData.paymentMethod,
        promoApplied: formData.appliedPromo?.code || null,
      };

      // Use backend cart API for checkout in Phase 1.2
      await fetch(apiUrl('/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
    } catch (err) {
      // Silently fail
    }

    setOrderData(formData);
    setOrderComplete(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (orderComplete) {
    return <OrderSuccessPage orderData={orderData} />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="py-16 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag size={80} strokeWidth={0.5} className="text-gray-200 mx-auto mb-6" />
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">{t('checkout.empty')}</h2>
          <p className="text-gray-400 mb-8">{t('checkout.emptySub')}</p>
          <Link to="/" className="inline-flex items-center space-x-2 px-8 py-4 bg-black text-white font-black uppercase text-sm tracking-widest hover:bg-[#ba1f3d] transition-all">
            <ArrowLeft size={16} />
            <span>{t('checkout.continue')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link to="/" onClick={() => openDrawer('cart')} className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#ba1f3d] transition-colors mb-4">
            <ArrowLeft size={14} />
            <span>{t('checkout.edit')}</span>
          </Link>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-3">{t('checkout.secure')}</p>
          <h1 className="text-5xl font-black uppercase tracking-tighter">{t('checkout.title')}</h1>
          <p className="text-gray-400 mt-3 text-sm">{t('checkout.subtitle')}</p>
        </div>
        <CheckoutForm onComplete={handleOrderComplete} stockWarnings={stockWarnings} />
      </div>
    </div>
  );
};

export default CheckoutPage;
