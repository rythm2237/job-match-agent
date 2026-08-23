import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/src/theme';

export default function ReadyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View>
          <View style={styles.icon}><Text style={styles.iconText}>✓</Text></View>
          <Text style={styles.title}>Your search is ready.</Text>
          <Text style={styles.subtitle}>Next, we will connect your CV, verify your preferences and start building a private stream of high-fit live jobs.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Before activation</Text>
          <Text style={styles.item}>• Add or confirm your CV</Text>
          <Text style={styles.item}>• Review suggested roles from your experience</Text>
          <Text style={styles.item}>• Confirm sensitive answers only when needed</Text>
        </View>

        <TouchableOpacity style={styles.primary} onPress={() => router.replace('/')}>
          <Text style={styles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  icon: { marginTop: 36, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF3' },
  iconText: { fontSize: 28, fontWeight: '800', color: theme.colors.success },
  title: { marginTop: 24, fontSize: 34, lineHeight: 40, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.8 },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 24, color: theme.colors.muted },
  card: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: theme.radius.lg, borderColor: theme.colors.border, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 10 },
  item: { fontSize: 14, lineHeight: 25, color: theme.colors.text },
  primary: { minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
