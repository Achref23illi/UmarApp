import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleContact = () => {
      Linking.openURL('mailto:support@umarapp.com');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text.primary }]}>Aide & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.primary} style={styles.icon} />
          <Text style={[styles.cardTitle, { color: colors.text.primary }]}>Besoin d'aide ?</Text>
          <Text style={[styles.cardText, { color: colors.text.secondary }]}>
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter si vous avez des questions ou des problèmes.
          </Text>
          <Pressable 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleContact}
          >
            <Text style={styles.buttonText}>Nous contacter</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>FAQ</Text>
            
            {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>Question fréquente {i} ?</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </View>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    gap: 32,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 16,
  },
  icon: {
      marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
      gap: 16,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
  },
  faqItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  faqQuestion: {
      fontSize: 16,
      fontWeight: '500',
  }
});
