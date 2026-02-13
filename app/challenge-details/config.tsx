import { toast } from '@/components/ui/Toast';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { challengeDetailsService } from '@/services/challengeDetailsService';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DayOption = {
  key: string;
  label: string;
  full: string;
};

const DAYS: DayOption[] = [
  { key: 'L', label: 'L', full: 'Lundi' },
  { key: 'Ma', label: 'M', full: 'Mardi' },
  { key: 'Me', label: 'M', full: 'Mercredi' },
  { key: 'J', label: 'J', full: 'Jeudi' },
  { key: 'V', label: 'V', full: 'Vendredi' },
  { key: 'S', label: 'S', full: 'Samedi' },
  { key: 'D', label: 'D', full: 'Dimanche' },
];

const LIMITS = {
  daysCount: { min: 1, max: 90 },
  exercisesCount: { min: 1, max: 20 },
  duration: { min: 1, max: 120 },
} as const;

type CounterSettingProps = {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (nextValue: number) => void;
  fontBold: string;
  fontMedium: string;
  fontRegular: string;
  colors: ReturnType<typeof useTheme>['colors'];
};

function CounterSetting({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  fontBold,
  fontMedium,
  fontRegular,
  colors,
}: CounterSettingProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[styles.settingLabel, { fontFamily: fontBold, color: colors.text.primary }]}>
          {label}
        </Text>
        <Text style={[styles.settingHint, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          {hint}
        </Text>
      </View>

      <View style={[styles.counterContainer, { borderColor: colors.border, backgroundColor: colors.surfaceHighlight }]}> 
        <Pressable
          onPress={() => canDecrease && onChange(value - 1)}
          disabled={!canDecrease}
          style={[styles.counterButton, !canDecrease && styles.counterButtonDisabled]}
        >
          <Ionicons
            name="remove"
            size={18}
            color={canDecrease ? Colors.palette.purple.primary : colors.text.secondary}
          />
        </Pressable>

        <Text style={[styles.counterValue, { fontFamily: fontMedium, color: colors.text.primary }]}>{value}</Text>

        <Pressable
          onPress={() => canIncrease && onChange(value + 1)}
          disabled={!canIncrease}
          style={[styles.counterButton, !canIncrease && styles.counterButtonDisabled]}
        >
          <Ionicons
            name="add"
            size={18}
            color={canIncrease ? Colors.palette.purple.primary : colors.text.secondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

type ToggleSettingProps = {
  label: string;
  hint: string;
  value: boolean;
  onChange: (nextValue: boolean) => void;
  fontBold: string;
  fontRegular: string;
  colors: ReturnType<typeof useTheme>['colors'];
};

function ToggleSetting({
  label,
  hint,
  value,
  onChange,
  fontBold,
  fontRegular,
  colors,
}: ToggleSettingProps) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[styles.settingLabel, { fontFamily: fontBold, color: colors.text.primary }]}>{label}</Text>
        <Text style={[styles.settingHint, { fontFamily: fontRegular, color: colors.text.secondary }]}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#CED0D5', true: 'rgba(103, 15, 164, 0.35)' }}
        thumbColor={value ? Colors.palette.purple.primary : '#FFFFFF'}
      />
    </View>
  );
}

export default function ChallengeConfigScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const levelId = useMemo(() => {
    const raw = (params as any)?.levelId ?? (params as any)?.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const challengeSlug = useMemo(() => {
    const raw = (params as any)?.challengeSlug ?? (params as any)?.challengeId;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const source = useMemo(() => {
    const raw = (params as any)?.source;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const [daysCount, setDaysCount] = useState(9);
  const [exercisesCount, setExercisesCount] = useState(2);
  const [duration, setDuration] = useState(5);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [arabic, setArabic] = useState(true);

  const [hasSavedBackendSettings, setHasSavedBackendSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const horizontalPadding = width < 360 ? 14 : 20;
  const chipSize = width < 360 ? 36 : 44;

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!levelId) {
          setHasSavedBackendSettings(false);
          return;
        }

        const [settings, configuredIds] = await Promise.all([
          challengeDetailsService.getSettingsForLevel(levelId),
          challengeDetailsService.getConfiguredLevelIds([levelId]),
        ]);

        if (!isActive) return;

        setDaysCount(settings.daysCount);
        setExercisesCount(settings.exercisesCount);
        setDuration(settings.durationMinutes);
        setSelectedDays(settings.selectedDays);
        setNotifications(settings.notifications);
        setReminders(settings.reminders);
        setArabic(settings.arabic);
        setHasSavedBackendSettings(configuredIds.includes(levelId));
      } catch (error) {
        console.error('Failed to load challenge settings:', error);
        if (!isActive) return;
        setLoadError('Impossible de charger les reglages.');
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [levelId, reloadNonce]);

  const toggleDay = (key: string) => {
    setSelectedDays((previous) =>
      previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]
    );
  };

  const selectedDaysLabel = useMemo(() => {
    const sorted = DAYS.filter((day) => selectedDays.includes(day.key));
    if (sorted.length === DAYS.length) return 'Tous les jours';
    if (sorted.length === 0) return 'Aucun jour selectionne';
    return sorted.map((day) => day.full).join(', ');
  }, [selectedDays]);

  const handleSave = async () => {
    try {
      if (!levelId) return;
      setIsSaving(true);

      const level = await challengeDetailsService.getLevelById(levelId);
      if (!level) throw new Error('Level not found');

      await challengeDetailsService.saveSettingsForLevel({
        levelId,
        categoryId: level.categoryId,
        settings: {
          daysCount,
          exercisesCount,
          durationMinutes: duration,
          selectedDays,
          notifications,
          reminders,
          arabic,
        },
      });

      setHasSavedBackendSettings(true);
      toast.show({ message: 'Reglages enregistres', type: 'success' });

      if (source === 'level') {
        router.back();
        return;
      }

      router.replace({
        pathname: '/challenge-details/level/[id]',
        params: { id: levelId, challengeSlug },
      });
    } catch (error) {
      console.error('Failed to save challenge settings:', error);
      toast.show({ message: 'Impossible d enregistrer les reglages', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.palette.neutral.gray100 }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 6, paddingHorizontal: horizontalPadding }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Parametres du niveau</Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Reglages reels relies a votre compte
          </Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingBottom: insets.bottom + 120,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
          </View>
        ) : null}

        {!isLoading && loadError ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <View style={styles.errorRow}>
              <Ionicons name="warning-outline" size={18} color={Colors.palette.semantic.warning} />
              <Text style={[styles.errorText, { fontFamily: fontMedium, color: colors.text.primary }]}>{loadError}</Text>
            </View>
            <Pressable
              onPress={() => {
                setLoadError(null);
                setReloadNonce((value) => value + 1);
              }}
              style={[styles.retryButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.retryText, { fontFamily: fontMedium, color: colors.text.primary }]}>Reessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !loadError ? (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Planification</Text>
                <View
                  style={[
                    styles.savedBadge,
                    {
                      backgroundColor: hasSavedBackendSettings
                        ? 'rgba(76, 175, 80, 0.12)'
                        : 'rgba(245, 198, 97, 0.2)',
                    },
                  ]}
                >
                  <Ionicons
                    name={hasSavedBackendSettings ? 'cloud-done-outline' : 'cloud-offline-outline'}
                    size={14}
                    color={hasSavedBackendSettings ? Colors.palette.semantic.success : Colors.palette.gold.dark}
                  />
                  <Text
                    style={[
                      styles.savedBadgeText,
                      {
                        fontFamily: fontMedium,
                        color: hasSavedBackendSettings
                          ? Colors.palette.semantic.success
                          : Colors.palette.gold.dark,
                      },
                    ]}
                  >
                    {hasSavedBackendSettings ? 'Sauvegarde backend' : 'Non sauvegarde'}
                  </Text>
                </View>
              </View>

              <CounterSetting
                label="Sur combien de jours ?"
                hint="Nombre total de jours du niveau"
                value={daysCount}
                min={LIMITS.daysCount.min}
                max={LIMITS.daysCount.max}
                onChange={setDaysCount}
                fontBold={fontBold}
                fontMedium={fontMedium}
                fontRegular={fontRegular}
                colors={colors}
              />

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.settingBlock}>
                <Text style={[styles.settingLabel, { fontFamily: fontBold, color: colors.text.primary }]}>Jours de rappel</Text>
                <View style={styles.dayGrid}>
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.key);
                    return (
                      <Pressable
                        key={day.key}
                        onPress={() => toggleDay(day.key)}
                        style={[
                          styles.dayChip,
                          {
                            width: chipSize,
                            height: chipSize,
                            borderRadius: chipSize / 2,
                            borderColor: isSelected ? Colors.palette.purple.primary : colors.border,
                            backgroundColor: isSelected ? Colors.palette.purple.primary : colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            {
                              fontFamily: fontMedium,
                              color: isSelected ? '#FFFFFF' : colors.text.primary,
                            },
                          ]}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.daysSummary, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                  {selectedDaysLabel}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <CounterSetting
                label="Exercices quotidiens"
                hint="Nombre d'actions a faire chaque jour"
                value={exercisesCount}
                min={LIMITS.exercisesCount.min}
                max={LIMITS.exercisesCount.max}
                onChange={setExercisesCount}
                fontBold={fontBold}
                fontMedium={fontMedium}
                fontRegular={fontRegular}
                colors={colors}
              />

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <CounterSetting
                label="Duree par exercice"
                hint="Temps en minutes"
                value={duration}
                min={LIMITS.duration.min}
                max={LIMITS.duration.max}
                onChange={setDuration}
                fontBold={fontBold}
                fontMedium={fontMedium}
                fontRegular={fontRegular}
                colors={colors}
              />
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <Text style={[styles.cardTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Notifications</Text>

              <ToggleSetting
                label="Notifications"
                hint="Pastilles, alarmes et bannieres"
                value={notifications}
                onChange={setNotifications}
                fontBold={fontBold}
                fontRegular={fontRegular}
                colors={colors}
              />

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <ToggleSetting
                label="Rappels"
                hint="Relance toutes les 5 minutes"
                value={reminders}
                onChange={setReminders}
                fontBold={fontBold}
                fontRegular={fontRegular}
                colors={colors}
              />

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <ToggleSetting
                label="Langue arabe"
                hint="Afficher le contenu arabe"
                value={arabic}
                onChange={setArabic}
                fontBold={fontBold}
                fontRegular={fontRegular}
                colors={colors}
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: insets.bottom + 14,
            borderTopColor: colors.divider,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: Colors.palette.purple.primary },
            (isSaving || isLoading || !!loadError) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving || isLoading || !!loadError}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.saveButtonText, { fontFamily: fontBold }]}>
              {source === 'level' ? 'Enregistrer' : 'Enregistrer et continuer'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTextBlock: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    textAlign: 'center',
  },
  loadingState: {
    paddingVertical: 44,
    alignItems: 'center',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  savedBadgeText: {
    fontSize: 11,
  },
  settingBlock: {
    gap: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 14,
  },
  settingHint: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 2,
  },
  counterButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.35,
  },
  counterValue: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 16,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 14,
  },
  daysSummary: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
