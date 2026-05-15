import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@restaurant-saas/shared';

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: r } = await supabase.from('restaurants').select('*').eq('slug', slug).single();
      setRestaurant(r);
      if (r) {
        const { data: mi } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', r.id)
          .neq('status', 'hidden');
        setItems(mi ?? []);
      }
    })();
  }, [slug]);

  if (!restaurant) return null;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>{restaurant.name}</Text>
          {restaurant.description && <Text style={{ color: '#666', marginTop: 4 }}>{restaurant.description}</Text>}
        </View>
      }
      renderItem={({ item }) => (
        <Pressable style={{ flexDirection: 'row', padding: 12, backgroundColor: 'white', marginHorizontal: 12, marginBottom: 8, borderRadius: 12 }}>
          {item.images?.[0] && (
            <Image source={{ uri: item.images[0] }} style={{ width: 80, height: 80, borderRadius: 8 }} />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '600' }}>{item.name}</Text>
            {item.description && <Text style={{ color: '#666', fontSize: 12 }} numberOfLines={2}>{item.description}</Text>}
            <Text style={{ marginTop: 4, fontWeight: '600' }}>{formatMoney(item.price, item.currency)}</Text>
            {item.calories && <Text style={{ fontSize: 11, color: '#999' }}>{item.calories} kcal</Text>}
          </View>
        </Pressable>
      )}
    />
  );
}
