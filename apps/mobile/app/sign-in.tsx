import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    await supabase.auth.signInWithOtp({ email });
    setSent(true);
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Sign in</Text>
      <Text style={{ color: '#666', marginTop: 4 }}>We'll send you a magic link.</Text>
      {sent ? (
        <Text style={{ marginTop: 24, color: 'green' }}>Check your inbox.</Text>
      ) : (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 24 }}
          />
          <Pressable
            onPress={submit}
            disabled={busy}
            style={{ backgroundColor: '#f59e0b', padding: 14, borderRadius: 8, marginTop: 12 }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
              {busy ? 'Sending…' : 'Send magic link'}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
