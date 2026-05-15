// Lightweight i18n dictionary. Apps can extend or replace with next-intl / i18next.

export type Locale = 'en' | 'ar';

export const isRTL = (locale: Locale) => locale === 'ar';

export const dict: Record<string, Record<Locale, string>> = {
  'nav.menu': { en: 'Menu', ar: 'القائمة' },
  'nav.book_table': { en: 'Book a Table', ar: 'احجز طاولة' },
  'nav.party_orders': { en: 'Party Orders', ar: 'طلبات الحفلات' },
  'nav.subscriptions': { en: 'Meal Plans', ar: 'باقات الوجبات' },
  'nav.specials': { en: 'Specials', ar: 'العروض المميزة' },
  'nav.complaints': { en: 'Feedback', ar: 'الملاحظات' },
  'nav.account': { en: 'Account', ar: 'الحساب' },

  'menu.add_to_cart': { en: 'Add to cart', ar: 'أضف للسلة' },
  'menu.calories': { en: 'kcal', ar: 'سعرة حرارية' },
  'menu.out_of_stock': { en: 'Out of stock', ar: 'نفذ' },

  'order.takeaway': { en: 'Takeaway', ar: 'استلام' },
  'order.delivery': { en: 'Delivery', ar: 'توصيل' },
  'order.dine_in': { en: 'Dine-in', ar: 'تناول في المطعم' },
  'order.pickup_time': { en: 'Pickup time', ar: 'وقت الاستلام' },
  'order.delivery_time': { en: 'Delivery time', ar: 'وقت التوصيل' },

  'payment.cash': { en: 'Cash', ar: 'نقدي' },
  'payment.card': { en: 'Card', ar: 'بطاقة' },
  'payment.stc_pay': { en: 'STC Pay', ar: 'STC Pay' },

  'cta.checkout': { en: 'Checkout', ar: 'الدفع' },
  'cta.place_order': { en: 'Place order', ar: 'تأكيد الطلب' },
  'cta.book': { en: 'Book', ar: 'احجز' },
  'cta.submit': { en: 'Submit', ar: 'إرسال' },

  'feedback.complaint': { en: 'Complaint', ar: 'شكوى' },
  'feedback.suggestion': { en: 'Suggestion', ar: 'اقتراح' },
  'feedback.compliment': { en: 'Compliment', ar: 'مدح' },
};

export function t(key: string, locale: Locale = 'en'): string {
  return dict[key]?.[locale] ?? key;
}
