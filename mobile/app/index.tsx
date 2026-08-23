import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/src/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.badge}><Text style={styles.badgeText}>JOB SEARCH, PREPARED FOR YOU</Text></View>
          <Text style={styles.title}>Spend less time searching. Focus on the right opportunities.</Text>
          <Text style={styles.subtitle}>
            Tell us what you want once. We find matching live roles, explain the fit and prepare the application package for you.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next</Text>
          <Text style={styles.row}>1  Add your CV</Text>
          <Text style={styles.row}>2  Pick roles and locations</Text>
          <Text style={styles.row}>3  Choose how much help you want</Text>
          <Text style={styles.note}>Most setup steps use suggestions and quick choices — very little typing.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primary} onPress={() => router.push('/onboarding')} accessibilityRole="button">
            <Text style={styles.primaryText}>Set up my job search</Text>
          </TouchableOpacity>
          <Text style={styles.privacy}>Your CV and preferences are private. You control what is saved and can delete your data.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  container: { flex: 1, padding: theme.spacing.lg, justifyContent: 'space-between' },
  hero: { paddingTop: theme.spacing.xl },
  badge: { alignSelf: 'flex-start', backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.radius.pill, marginBottom: 18 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7, color: theme.colors.primary },
  title: { fontSize: 35, lineHeight: 41, fontWeight: '800', color: theme.colors.text, letterSpacing: -1 },
  subtitle: { marginTop: 16, fontSize: 17, lineHeight: 25, color: theme.colors.muted },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text, marginBottom: 12 },
  row: { fontSize: 15, lineHeight: 30, color: theme.colors.text },
  note: { marginTop: 10, fontSize: 13, lineHeight: 19, color: theme.colors.muted },
  actions: { gap: 12 },
  primary: { backgroundColor: theme.colors.primary, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radius.md },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  privacy: { textAlign: 'center', color: theme.colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 12 },
});
