import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text.primary }]}>Umar Premium</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <LinearGradient
            colors={['#8B3DB8', '#5D2E86']}
            style={styles.heroCard}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="star" size={32} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>Débloquez tout le potentiel</Text>
            <Text style={styles.heroText}>Accédez à toutes les fonctionnalités premium et soutenez le développement de l'application.</Text>
            
            <View style={styles.priceTag}>
               <Text style={styles.price}>4.99€</Text>
               <Text style={styles.period}>/ mois</Text>
            </View>
        </LinearGradient>

        <View style={styles.featuresList}>
            <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Fonctionnalités incluses</Text>
            
            {[
                'Pas de publicités',
                'Accès illimité aux Quiz',
                'Statistiques avancées',
                'Badge Premium sur votre profil',
                'Support prioritaire'
            ].map((feature, index) => (
                <View key={index} style={[styles.featureItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.text.primary }]}>{feature}</Text>
                </View>
            ))}
        </View>

        <Pressable style={[styles.subscribeButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.subscribeText}>S'abonner maintenant</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: colors.text.secondary }]}>
            L'abonnement se renouvelle automatiquement. Vous pouvez annuler à tout moment depuis les réglages de votre compte store.
        </Text>

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
    gap: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
  },
  heroTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFF',
      textAlign: 'center',
  },
  heroText: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      lineHeight: 22,
  },
  priceTag: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: 12,
      backgroundColor: 'rgba(0,0,0,0.2)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
  },
  price: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFF',
  },
  period: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      marginLeft: 4,
  },
  featuresList: {
      gap: 12,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginBottom: 8,
  },
  featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
  },
  checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
  },
  featureText: {
      fontSize: 16,
      fontWeight: '500',
  },
  subscribeButton: {
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
  },
  subscribeText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  disclaimer: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 18,
  }
});
