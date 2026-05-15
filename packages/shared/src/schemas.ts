import { z } from 'zod';

export const checkoutPayloadSchema = z.object({
  restaurant_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  order_type: z.enum(['delivery', 'takeaway', 'dine_in']),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
    modifier_option_ids: z.array(z.string().uuid()).optional(),
    notes: z.string().max(500).optional(),
  })).min(1),
  slot_start: z.string().datetime().optional(),
  slot_end: z.string().datetime().optional(),
  delivery_address_id: z.string().uuid().optional(),
  table_number: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'stc_pay', 'apple_pay', 'mada', 'tap', 'hyperpay', 'stripe', 'wallet']),
  coupon_code: z.string().optional(),
  notes: z.string().max(500).optional(),
  tip_total: z.number().min(0).optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;

export const reservationPayloadSchema = z.object({
  restaurant_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  arrival_time: z.string().datetime(),
  party_size: z.number().int().min(1).max(50),
  guest_name: z.string().optional(),
  guest_phone: z.string().optional(),
  notes: z.string().max(500).optional(),
  linked_order_items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).optional(),
});

export type ReservationPayload = z.infer<typeof reservationPayloadSchema>;

export const partyOrderPayloadSchema = z.object({
  restaurant_id: z.string().uuid(),
  contact_name: z.string().min(2),
  contact_phone: z.string().min(7),
  contact_email: z.string().email().optional(),
  event_name: z.string().optional(),
  event_date: z.string().datetime(),
  guest_count: z.number().int().min(10),
  service_type: z.enum(['drop-off', 'buffet', 'plated', 'staff-included']).optional(),
  venue_address: z.string().optional(),
  selected_items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).optional(),
  special_requests: z.string().max(1000).optional(),
});

export type PartyOrderPayload = z.infer<typeof partyOrderPayloadSchema>;

export const feedbackPayloadSchema = z.object({
  restaurant_id: z.string().uuid(),
  feedback_type: z.enum(['complaint', 'suggestion', 'compliment', 'bug']),
  subject: z.string().max(200).optional(),
  body: z.string().min(5).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  order_id: z.string().uuid().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
});

export type FeedbackPayload = z.infer<typeof feedbackPayloadSchema>;

export const subscriptionPayloadSchema = z.object({
  restaurant_id: z.string().uuid(),
  meal_plan_id: z.string().uuid(),
  start_date: z.string(),
  delivery_address_id: z.string().uuid().optional(),
  delivery_time_slot: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'stc_pay', 'apple_pay', 'mada', 'tap', 'hyperpay', 'stripe', 'wallet']),
});

export type SubscriptionPayload = z.infer<typeof subscriptionPayloadSchema>;
