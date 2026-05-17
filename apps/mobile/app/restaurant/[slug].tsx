import { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/lib/cart-store';
import { formatMoney } from '@restaurant-saas/shared';

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const add = useCart((s) => s.add);
  const cartCount = useCart((s) => s.count());

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
      setRestaurant(r);
      if (r) {
        const { data: mi } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', r.id)
          .neq('status', 'hidden')
          .order('sort_order');
        setItems(mi ?? []);
      }
    })();
  }, [slug]);

  if (!restaurant) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 96 : 16 }}
        ListHeaderComponent={
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>{restaurant.name}</Text>
            {restaurant.description && (
              <Text style={{ color: '#666', marginTop: 4 }}>{restaurant.description}</Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const oos = item.status !== 'available';
          return (
            <Pressable
              disabled={oos}
              onPress={() =>
                add(
                  { id: restaurant.id, slug: restaurant.slug, name: restaurant.name, currency: restaurant.currency },
                  { menu_item_id: item.id, name: item.name, unit_price: Number(item.price), quantity: 1 }
                )
              }
              style={{
                flexDirection: 'row',
                padding: 12,
                backgroundColor: 'white',
                marginHorizontal: 12,
                marginBottom: 8,
                borderRadius: 12,
                opacity: oos ? 0.5 : 1,
              }}
            >
              {item.images?.[0] && (
                <Image source={{ uri: item.images[0] }} style={{ width: 80, height: 80, borderRadius: 8 }} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                {item.description && (
                  <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={2}>{item.description}</Text>
                )}
                <Text style={{ marginTop: 4, fontWeight: '600' }}>
                  {formatMoney(item.price, item.currency)}
                </Text>
                {item.calories != null && (
                  <Text style={{ fontSize: 11, color: '#999' }}>{item.calories} kcal</Text>
                )}
              </View>
              {!oos && (
                <View style={{ justifyContent: 'center' }}>
                  <Text style={{ color: '#ea580c', fontWeight: '700', fontSize: 22 }}>+</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
      {cartCount > 0 && (
        <Pressable
          onPress={() => router.push('/cart')}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 24,
            backgroundColor: '#ea580c',
            padding: 16,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>View cart · {cartCount} item{cartCount === 1 ? '' : 's'}</Text>
          <Text style={{ color: 'white', fontWeight: '700' }}>→</Text>
        </Pressable>
      )}
    </View>
  );
}
