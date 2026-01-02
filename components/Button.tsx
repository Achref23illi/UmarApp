import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from 'react-native';

// Hardcoded colors for reliability
const COLORS = {
  primary: '#670FA4',
  secondary: '#F5C661',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  disabled: '#E0E0E0',
};

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  // Determine colors based on variant
  const getColors = () => {
    if (disabled) {
      return { bg: COLORS.disabled, text: COLORS.gray, border: 'transparent' };
    }
    switch (variant) {
      case 'secondary':
        return { bg: COLORS.secondary, text: COLORS.black, border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', text: COLORS.primary, border: COLORS.primary };
      case 'ghost':
        return { bg: 'transparent', text: COLORS.primary, border: 'transparent' };
      default:
        return { bg: COLORS.primary, text: COLORS.white, border: 'transparent' };
    }
  };

  const colors = getColors();

  // Determine height based on size
  const getHeight = () => {
    switch (size) {
      case 'sm': return 40;
      case 'lg': return 56;
      default: return 48;
    }
  };

  const height = getHeight();
  const fontSize = size === 'lg' ? 18 : size === 'sm' ? 14 : 16;
  const iconSize = size === 'lg' ? 22 : size === 'sm' ? 18 : 20;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          height,
          width: fullWidth ? '100%' : undefined,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={colors.text} style={styles.iconLeft} />
          )}
          <Text style={[styles.text, { color: colors.text, fontSize }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={colors.text} style={styles.iconRight} />
          )}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
