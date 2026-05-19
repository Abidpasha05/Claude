import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/lib/cart-store';
import { api } from '@/lib/api';
import { computePricing, formatMoney, formatSlot, generateSlots } from '@aklio/shared';
import type { PaymentMethod } from '@aklio/shared';

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'stc_pay', label: 'STC Pay' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { lines, restaurant_id, restaurant_currency, clear } = useCart();

  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>('takeaway');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [slotIso, setSlotIso] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const slots = useMemo(
    () => generateSlots(new Date(), {
      open_time: '10:00',
      close_time: '23:00',
      slot_duration_minutes: 30,
      prep_minutes: 30,
    }).slice(0, 12),
    []
  );

  const pricing = computePricing({
    lines,
    delivery_fee: orderType === 'delivery' ? 15 : 0,
    tax_rate: 0.15,
  });

  async function place() {
    if (!restaurant_id || !slotIso || !phone) {
      Alert.alert('Missing info', 'Choose a time slot and enter your phone number.');
      return;
    }
    setBusy(true);
    try {
      const slot = slots.find((s) => s.start === slotIso);
      const json = await api<{ order: any; redirect_url: string | null }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id,
          order_type: orderType,
          items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
          slot_start: slot?.start,
          slot_end: slot?.end,
          payment_method: paymentMethod,
          guest_name: name || undefined,
          guest_phone: phone,
          delivery_address: orderType === 'delivery' ? address : undefined,
          notes: notes || undefined,
        }),
      });
      clear();
      if (json.redirect_url) {
        // Open Tap-hosted page in the system browser; the webhook updates
        // the order. When the user returns to the app, the live tracking
        // screen reflects the new status via Realtime.
        await Linking.openURL(json.redirect_url);
        router.replace(`/order/${json.order.id}`);
      } else {
        router.replace(`/order/${json.order.id}`);
      }
    } catch (e: any) {
      Alert.alert('Order failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <Section title="Order type">
        <Row>
          <Toggle active={orderType === 'takeaway'} onPress={() => setOrderType('takeaway')} label="Takeaway" />
          <Toggle active={orderType === 'delivery'} onPress={() => setOrderType('delivery')} label="Delivery" />
        </Row>
      </Section>

      <Section title={orderType === 'delivery' ? 'Delivery time' : 'Pickup time'}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {slots.map((s) => (
            <Pressable
              key={s.start}
              onPress={() => setSlotIso(s.start)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: slotIso === s.start ? '#f59e0b' : 'white',
                borderWidth: 1,
                borderColor: slotIso === s.start ? '#f59e0b' : '#ddd',
                marginRight: 8,
              }}
            >
              <Text style={{ color: slotIso === s.start ? 'white' : '#333', fontWeight: '600' }}>
                {formatSlot(s)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <Section title="Contact">
        <Input value={name} onChangeText={setName} placeholder="Name" />
        <Input value={phone} onChangeText={setPhone} placeholder="Phone (e.g. +9665...)" keyboardType="phone-pad" />
        {orderType === 'delivery' && (
          <Input value={address} onChangeText={setAddress} placeholder="Delivery address" multiline />
        )}
        <Input value={notes} onChangeText={setNotes} placeholder="Order notes (optional)" multiline />
      </Section>

      <Section title="Payment">
        <Row>
          {PAYMENT_OPTIONS.map((p) => (
            <Toggle
              key={p.value}
              active={paymentMethod === p.value}
              onPress={() => setPaymentMethod(p.value)}
              label={p.label}
            />
          ))}
        </Row>
      </Section>

      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginTop: 8 }}>
        <SummaryRow label="Subtotal" value={formatMoney(pricing.subtotal, restaurant_currency)} />
        <SummaryRow label="VAT (15%)" value={formatMoney(pricing.tax, restaurant_currency)} />
        {pricing.delivery_fee > 0 && (
          <SummaryRow label="Delivery" value={formatMoney(pricing.delivery_fee, restaurant_currency)} />
        )}
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
        <SummaryRow label="Total" value={formatMoney(pricing.grand_total, restaurant_currency)} bold />
      </View>

      <Pressable
        disabled={busy || !slotIso || !phone}
        onPress={place}
        style={{
          backgroundColor: busy || !slotIso || !phone ? '#fbbf24' : '#f59e0b',
          padding: 16,
          borderRadius: 12,
          marginTop: 16,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
          {busy ? 'Placing…' : 'Place order'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}

function Toggle({ active, onPress, label }: { active: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: active ? '#f59e0b' : 'white',
        borderWidth: 1,
        borderColor: active ? '#f59e0b' : '#ddd',
      }}
    >
      <Text style={{ color: active ? 'white' : '#333', fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      style={{
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
      }}
    />
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: bold ? '#000' : '#666', fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontWeight: bold ? '700' : '500' }}>{value}</Text>
    </View>
  );
}
