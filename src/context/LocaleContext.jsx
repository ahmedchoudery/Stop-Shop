import React, { createContext, useContext, useState, useEffect } from 'react';

const LocaleContext = createContext();

const LOCALE_STORAGE_KEY = 'stopshop-locale';

const translations = {
  'en-US': {
    'nav.home': 'Home',
    'nav.tops': 'Tops',
    'nav.bottoms': 'Bottoms',
    'nav.footwear': 'Footwear',
    'nav.accessories': 'Accessories',
    'cart.add': 'Add to Cart',
    'cart.view': 'View Cart',
    'cart.total': 'Total',
    'search.placeholder': 'Search luxury items...',
    'auth.admin': 'Admin Portal',
    'auth.login': 'Login',
    'status.trending': 'Trending',
    'status.soldOut': 'Sold Out',
    'status.finalStock': 'Final Stock',
    'footer.security': 'Secure Delivery · Global Craft · Cardinal Tier',
    'checkout.title': 'Complete Your Order',
    'checkout.subtitle': '256-bit SSL encrypted · Safe & Secure',
    'checkout.edit': 'Edit Bag',
    'checkout.secure': 'Secure Checkout',
    'checkout.empty': 'Your bag is empty',
    'checkout.emptySub': 'Add some items to checkout',
    'checkout.continue': 'Continue Shopping',
    'checkout.step1': 'Shipping',
    'checkout.step2': 'Payment',
    'checkout.step3': 'Review',
    'checkout.info': 'Shipping Info',
    'checkout.payment': 'Payment',
    'checkout.review': 'Order Review',
    'checkout.confirm': 'Confirm Order',
    'checkout.next': 'Next Step',
    'checkout.back': 'Back',
    'checkout.total': 'Total',
    'checkout.subtotal': 'Subtotal',
    'checkout.discount': 'Discount',
    'forms.firstName': 'First Name',
    'forms.lastName': 'Last Name',
    'forms.email': 'Email Address',
    'forms.phone': 'Phone Number',
    'forms.address': 'Street Address',
    'forms.city': 'City',
    'forms.zip': 'Postal Code',
    'forms.required': 'is required',
    'forms.invalid': 'is invalid',
    'success.title': 'Thank You!',
    'success.subtitle': 'Your order has been placed successfully. You\'ll receive a confirmation email shortly.',
    'success.confirmed': 'Order Confirmed',
    'success.ref': 'Order Reference',
    'timeline.title': 'Delivery Timeline',
    'timeline.pack': 'Being Packed',
    'timeline.ship': 'Out for Delivery',
    'timeline.days': 'days',
    'timeline.today': 'Today',
    'timeline.now': 'Just now'
  },
  'ur-PK': {
    'nav.home': 'ہوم',
    'nav.tops': 'ٹاپس',
    'nav.bottoms': 'بوٹمز',
    'nav.footwear': 'جوتے',
    'nav.accessories': 'ایکسیسریز',
    'cart.add': 'کارٹ میں شامل کریں',
    'cart.view': 'کارٹ دیکھیں',
    'cart.total': 'کل مجموعہ',
    'search.placeholder': 'تلاش کریں...',
    'auth.admin': 'ایڈمن پورٹل',
    'auth.login': 'لاگ ان',
    'status.trending': 'مشہور',
    'status.soldOut': 'ختم ہو گیا',
    'status.finalStock': 'آخری سٹاک',
    'footer.security': 'محفوظ ترسیل · عالمی دستکاری · کارڈینل ٹیر',
    'checkout.title': 'اپنا آرڈر مکمل کریں',
    'checkout.subtitle': '256 بٹ ایس ایس ایل انکرپٹڈ · محفوظ اور مامون',
    'checkout.edit': 'بیگ تبدیل کریں',
    'checkout.secure': 'محفوظ چیک آؤٹ',
    'checkout.empty': 'آپ کا بیگ خالی ہے',
    'checkout.emptySub': 'چیک آؤٹ کے لیے اشیاء شامل کریں',
    'checkout.continue': 'خریداری جاری رکھیں',
    'checkout.step1': 'ترسیل',
    'checkout.step2': 'ادائیگی',
    'checkout.step3': 'جائزہ',
    'checkout.info': 'ترسیل کی معلومات',
    'checkout.payment': 'ادائیگی',
    'checkout.review': 'آرڈر کا جائزہ',
    'checkout.confirm': 'آرڈر کی تصدیق کریں',
    'checkout.next': 'اگلا قدم',
    'checkout.back': 'واپس',
    'checkout.total': 'کل مجموعہ',
    'checkout.subtotal': 'ذیلی مجموعہ',
    'checkout.discount': 'رعایت',
    'forms.firstName': 'پہلا نام',
    'forms.lastName': 'آخری نام',
    'forms.email': 'ای میل ایڈریس',
    'forms.phone': 'فون نمبر',
    'forms.address': 'گھر کا پتہ',
    'forms.city': 'شہر',
    'forms.zip': 'پوسٹل کوڈ',
    'forms.required': 'ضروری ہے',
    'forms.invalid': 'غلط ہے',
    'success.title': 'شکریہ!',
    'success.subtitle': 'آپ کا آرڈر کامیابی کے ساتھ موصول ہو گیا ہے۔ جلد ہی آپ کو ایک ای میل موصول ہوگی۔',
    'success.confirmed': 'آرڈر کی تصدیق ہو گئی',
    'success.ref': 'آرڈر ریفرنس',
    'timeline.title': 'ترسیل کا وقت',
    'timeline.pack': 'پیک ہو رہا ہے',
    'timeline.ship': 'ترسیل کے لیے روانہ',
    'timeline.days': 'دن',
    'timeline.today': 'آج',
    'timeline.now': 'ابھی'
  }
};

export const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState('en-US');

  useEffect(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && translations[saved]) {
      setLocale(saved);
    }
  }, []);

  const changeLocale = (code) => {
    if (translations[code]) {
      setLocale(code);
      localStorage.setItem(LOCALE_STORAGE_KEY, code);
      // Optional: Set document direction for RTL support (Urdu)
      document.dir = code === 'ur-PK' ? 'rtl' : 'ltr';
    }
  };

  const t = (key) => {
    return translations[locale][key] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
};
