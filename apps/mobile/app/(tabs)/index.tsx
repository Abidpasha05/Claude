import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
}

export default function DiscoverScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    supabase
      .from('restaurants')
      .select('id, slug, name, description, cover_image_url')
      .eq('is_active', true)
      .then(({ data }) => setRestaurants(data ?? []));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Link href={`/restaurant/${item.slug}`} asChild>
            <Pressable style={{ backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
              {item.cover_image_url && (
                <Image source={{ uri: item.cover_image_url }} style={{ width: '100%', height: 160 }} />
              )}
              <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600' }}>{item.name}</Text>
                {item.description && <Text style={{ color: '#666', marginTop: 4 }}>{item.description}</Text>}
              </View>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>No restaurants yet.</Text>}
      />
    </View>
  );
}
