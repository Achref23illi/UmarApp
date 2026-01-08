import React from 'react';
import { View, Text, StyleSheet, ImageBackground, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
  
  const LeftContent = () => (
    <View style={styles.leftContent}>
       <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={32} color={imageSource ? '#fff' : color} />
       </View>
       <Text style={[styles.title, imageSource && styles.textWhite]} numberOfLines={1} adjustsFontSizeToFit>
         {title}
       </Text>
       {subtitle && <Text style={[styles.subtitle, imageSource && styles.textWhite]}>{subtitle}</Text>}
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {/* Left Side: Big Title & Icon with Image Background */}
        <View style={styles.leftSection}>
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
        <View style={styles.rightSection}>
          <Ionicons name="flower-outline" size={18} color="#9C27B0" style={styles.flowerIcon} />
          <Text style={styles.description} numberOfLines={6}>
            {description || 'Aucune description disponible pour ce challenge.'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="time-outline" size={16} color="#9C27B0" />
          <Text style={styles.footerText}>{duration}</Text>
        </View>
        
        <View style={styles.footerSeparator} />
        
        <View style={styles.footerItem}>
          <Ionicons name="stats-chart-outline" size={16} color="#9C27B0" />
          <Text style={styles.footerText}>{levels}</Text>
        </View>
        
        <View style={styles.footerSeparator} />

        <View style={styles.footerItem}>
          <Text style={styles.prerequisiteLabel}>Pré-requis : </Text>
          <Text style={styles.prerequisiteValue}>{prerequisite}</Text>
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
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
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
    backgroundColor: '#F9FAFB',
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
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Metropolis-Medium',
    color: '#666',
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
    borderLeftColor: '#F3F4F6',
  },
  description: {
    fontSize: 11,
    fontFamily: 'Metropolis-Regular',
    color: '#4B5563',
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
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Metropolis-Medium',
    color: '#374151',
  },
  footerSeparator: {
    width: 1,
    height: 14,
    backgroundColor: '#E5E7EB',
  },
  prerequisiteLabel: {
    fontSize: 11,
    fontFamily: 'Metropolis-Bold',
    color: '#9C27B0',
  },
  prerequisiteValue: {
    fontSize: 11,
    fontFamily: 'Metropolis-Regular',
    color: '#374151',
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
