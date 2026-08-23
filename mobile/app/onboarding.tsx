import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { theme } from '@/src/theme';

type Step = {
  title: string;
  hint: string;
  options: string[];
  multi?: boolean;
};

const steps: Step[] = [
  {
    title: 'What kind of work are you looking for?',
    hint: 'Choose a few. We will learn from your CV and refine these later.',
    options: ['AI & Automation', 'Data & BI', 'Business Analysis', 'Operations', 'Supply Chain', 'Product', 'Consulting', 'Team Leadership'],
    multi: true,
  },
  {
    title: 'Where should we search?',
    hint: 'You can change this anytime.',
    options: ['Across Europe', 'My current country', 'Remote in Europe', 'Choose countries'],
  },
  {
    title: 'How do you want to work?',
    hint: 'Select all that are acceptable.',
    options: ['Remote', 'Hybrid', 'On-site', 'Open to relocation'],
    multi: true,
  },
  {
    title: 'How much should we prepare for you?',
    hint: 'You stay in control. We never claim an application was sent unless it really was.',
    options: ['Find matches only', 'Prepare my applications', 'Prepare + send eligible email applications'],
  },
  {
    title: 'When should your daily update arrive?',
    hint: 'We will use your local timezone.',
    options: ['08:00', '18:00', '20:30', '21:30', 'No daily digest'],
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const step = steps[index];
  const selected = answers[index] ?? [];
  const progress = useMemo(() => `${index + 1} of ${steps.length}`, [index]);

  function toggle(option: string) {
    if (!step.multi) {
      setAnswers((current) => ({ ...current, [index]: [option] }));
      return;
    }
    setAnswers((current) => {
      const existing = current[index] ?? [];
      const next = existing.includes(option) ? existing.filter((item) => item !== option) : [...existing, option];
      return { ...current, [index]: next };
    });
  }

  function next() {
    if (index === steps.length - 1) {
      router.replace('/ready');
      return;
    }
    setIndex((value) => value + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (index === 0 ? router.back() : setIndex((value) => value - 1))}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>{progress}</Text>
      </View>

      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / steps.length) * 100}%` }]} /></View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.hint}>{step.hint}</Text>

        <View style={styles.options}>
          {step.options.map((option) => {
            const active = selected.includes(option);
            return (
              <TouchableOpacity key={option} onPress={() => toggle(option)} style={[styles.option, active && styles.optionActive]} accessibilityRole="button">
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
                <Text style={[styles.check, active && styles.checkActive]}>{active ? '✓' : '+'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity disabled={selected.length === 0} onPress={next} style={[styles.primary, selected.length === 0 && styles.primaryDisabled]}>
          <Text style={styles.primaryText}>{index === steps.length - 1 ? 'Review my setup' : 'Continue'}</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>You can edit every preference later.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  back: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  progress: { color: theme.colors.muted, fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: theme.colors.border },
  progressFill: { height: 4, backgroundColor: theme.colors.primary },
  body: { padding: 24, paddingBottom: 160 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.7 },
  hint: { marginTop: 10, color: theme.colors.muted, fontSize: 15, lineHeight: 22 },
  options: { marginTop: 26, gap: 12 },
  option: { minHeight: 64, paddingHorizontal: 18, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft },
  optionText: { color: theme.colors.text, fontSize: 16, fontWeight: '700', flex: 1, paddingRight: 12 },
  optionTextActive: { color: theme.colors.primary },
  check: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', color: theme.colors.muted, backgroundColor: theme.colors.bg, fontSize: 18, fontWeight: '700' },
  checkActive: { backgroundColor: theme.colors.primary, color: '#FFFFFF' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 28, backgroundColor: theme.colors.bg, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primary: { minHeight: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryDisabled: { opacity: 0.35 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  footerNote: { textAlign: 'center', marginTop: 9, fontSize: 12, color: theme.colors.muted },
});
