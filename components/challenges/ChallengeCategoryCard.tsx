import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

interface ChallengeCategoryCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  duration: string;
  levels: string;
  prerequisite: string;
  iconName: string; 
  imageSource?: ImageSourcePropType;
  isLocked?: boolean;
  color?: string;
}

export default function ChallengeCategoryCard({
  title,
  subtitle,
  description,
  duration,
  levels,
  prerequisite,
  iconName,
  imageSource,
  isLocked = false,
  color = '#000',
}: ChallengeCategoryCardProps) {
  const { colors } = useTheme();
  
  const LeftContent = () => (
    <View style={styles.leftContent}>
       <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={32} color={imageSource ? '#fff' : color} />
       </View>
       <Text style={[styles.title, { color: colors.text.primary }, imageSource && styles.textWhite]} numberOfLines={1} adjustsFontSizeToFit>
         {title}
       </Text>
       {subtitle && <Text style={[styles.subtitle, { color: colors.text.secondary }, imageSource && styles.textWhite]}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <View style={styles.contentRow}>
        {/* Left Side: Big Title & Icon with Image Background */}
        <View style={[styles.leftSection, { backgroundColor: colors.surfaceHighlight }]}>
            {imageSource ? (
                <ImageBackground 
                    source={imageSource} 
                    style={styles.imageBackground}
                    blurRadius={2} // Adds slight blur as requested
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                        style={styles.imageOverlay}
                    >
                         <LeftContent />
                    </LinearGradient>
                </ImageBackground>
            ) : (
                <LeftContent />
            )}
        </View>

        {/* Right Side: Description */}
        <View style={[styles.rightSection, { borderLeftColor: colors.border }]}>
          <Ionicons name="flower-outline" size={18} color="#9C27B0" style={styles.flowerIcon} />
          <Text style={[styles.description, { color: colors.text.secondary }]} numberOfLines={6}>
            {description || 'Aucune description disponible pour ce challenge.'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={16} color="#9C27B0" />
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>{duration}</Text>
        </View>
        
        <View style={[styles.footerSeparator, { backgroundColor: colors.border }]} />
        
        <View style={styles.footerItem}>
          <Ionicons name="stats-chart-outline" size={16} color="#9C27B0" />
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>{levels}</Text>
        </View>
        
        <View style={[styles.footerSeparator, { backgroundColor: colors.border }]} />

        <View style={styles.footerItem}>
          <Text style={styles.prerequisiteLabel}>Pré-requis : </Text>
          <Text style={[styles.prerequisiteValue, { color: colors.text.secondary }]}>{prerequisite}</Text>
        </View>
      </View>

      {/* Locked Overlay */}
      {isLocked && (
        <View style={styles.lockOverlay}>
           <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={20} color="#fff" />
           </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden', 
  },
  contentRow: {
    flexDirection: 'row',
    height: 140, // Fixed height for consistency
  },
  leftSection: {
    width: 130, // Fixed width for square-ish look
    position: 'relative',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Metropolis-Bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Metropolis-Medium',
    textAlign: 'center',
    marginTop: 2,
  },
  textWhite: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rightSection: {
    flex: 1,
    padding: 16,
    paddingRight: 24, 
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  description: {
    fontSize: 11,
    fontFamily: 'Metropolis-Regular',
    lineHeight: 16,
  },
  flowerIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Metropolis-Medium',
  },
  footerSeparator: {
    width: 1,
    height: 14,
  },
  prerequisiteLabel: {
    fontSize: 11,
    fontFamily: 'Metropolis-Bold',
    color: '#9C27B0',
  },
  prerequisiteValue: {
    fontSize: 11,
    fontFamily: 'Metropolis-Regular',
  },
  lockOverlay: {
    position: 'absolute',
    left: 100, // Near the edge of the image
    bottom: 55, 
    zIndex: 10,
  },
  lockIconContainer: {
    backgroundColor: '#FFC107',
    padding: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  }
});
