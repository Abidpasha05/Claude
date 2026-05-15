// Core domain types. Mirrors the database schema; can be regenerated via `supabase gen types`.

export type UserRole = 'customer' | 'restaurant_owner' | 'restaurant_staff' | 'driver' | 'platform_admin';

export type OrderType = 'delivery' | 'takeaway' | 'dine_in' | 'party' | 'subscription';

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'canceled'
  | 'refunded'
  | 'failed';

export type PaymentMethod = 'cash' | 'card' | 'stc_pay' | 'apple_pay' | 'mada' | 'tap' | 'hyperpay' | 'stripe' | 'wallet';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no_show' | 'canceled';

export type PartyOrderStatus = 'inquiry' | 'quoted' | 'confirmed' | 'preparing' | 'delivered' | 'completed' | 'canceled';

export type MealPlanPeriod = 'weekly' | 'monthly';

export type MealSubscriptionStatus = 'active' | 'paused' | 'canceled' | 'expired';

export type PromotionType = 'percentage' | 'fixed_amount' | 'bogo' | 'free_delivery' | 'happy_hour' | 'closing_hour';

export type FeedbackType = 'complaint' | 'suggestion' | 'compliment' | 'bug';
export type FeedbackStatus = 'open' | 'in_review' | 'responded' | 'resolved' | 'closed';

export type NotificationKind =
  | 'daily_menu'
  | 'order_update'
  | 'reservation_reminder'
  | 'promotion'
  | 'subscription_reminder'
  | 'party_update'
  | 'feedback_reply';

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  cuisine_types: string[];
  country_code: string;
  currency: string;
  default_locale: string;
  supports_locales: string[];
  timezone: string;
  delivery_enabled: boolean;
  takeaway_enabled: boolean;
  dine_in_enabled: boolean;
  party_orders_enabled: boolean;
  subscriptions_enabled: boolean;
  min_order_amount: number;
  base_delivery_fee: number;
  preparation_time_minutes: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  calories: number | null;
  status: 'available' | 'out_of_stock' | 'hidden' | 'scheduled';
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_halal: boolean;
  is_spicy: boolean;
  allergens: string[];
  tags: string[];
  images: string[];
}

export interface CartLine {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  modifiers?: { name: string; price_delta: number }[];
  notes?: string;
}

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
  available: boolean;
  capacity_remaining?: number;
}
