import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

type Coords = { lat: number; lng: number };

export interface PrayerTime {
  name: string;
  time: string;
  isNext?: boolean;
}

interface HijriDate {
  day: string;
  month: string;
  year: string;
}

interface UsePrayerTimesOptions {
  coords?: Coords;
  language?: string;
  method?: number;
}

export function usePrayerTimes(options: UsePrayerTimesOptions = {}) {
  const { coords, language = 'en', method = 2 } = options;

  const [currentCoords, setCurrentCoords] = useState<Coords | undefined>(coords);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; timeRemaining: string } | null>(null);
  const [hijriDate, setHijriDate] = useState<HijriDate | null>(null);
  const [gregorianDate, setGregorianDate] = useState<string>('');
  const [qiyamTimeRemaining, setQiyamTimeRemaining] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Keep coords in sync when provided externally
  useEffect(() => {
    if (coords) {
      setCurrentCoords(coords);
    }
  }, [coords]);

  useEffect(() => {
    let mounted = true;

    const fetchPrayerTimes = async (latitude: number, longitude: number) => {
      try {
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=${method}`
        );
        const data = await response.json();

        if (data.code === 200 && mounted) {
          const timings = data.data.timings;
          const date = data.data.date;

          // Hijri date
          setHijriDate({
            day: date.hijri.day,
            month: date.hijri.month.en,
            year: date.hijri.year,
          });

          // Gregorian date (locale-aware)
          const locale = language === 'ar' ? 'ar' : language === 'fr' ? 'fr-FR' : 'en-US';
          const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          };
          const formattedDate = today.toLocaleDateString(locale, dateOptions);
          setGregorianDate(formattedDate);

          const orderedPrayers: PrayerTime[] = [
            { name: 'Fajr', time: timings.Fajr },
            { name: 'Dhuhr', time: timings.Dhuhr },
            { name: 'Asr', time: timings.Asr },
            { name: 'Maghrib', time: timings.Maghrib },
            { name: 'Isha', time: timings.Isha },
          ];

          // Find next prayer
          const now = new Date();
          let next: { name: string; time: string; timeRemaining: string } | null = null;
          for (const prayer of orderedPrayers) {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = new Date(now);
            prayerTime.setHours(hours, minutes, 0, 0);

            if (prayerTime > now) {
              const diff = prayerTime.getTime() - now.getTime();
              const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
              const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              next = {
                name: prayer.name,
                time: prayer.time,
                timeRemaining: hoursRemaining > 0 ? `${hoursRemaining}h${minutesRemaining}m` : `${minutesRemaining}m`,
              };
              break;
            }
          }

          // If no prayer remaining today, mark Fajr tomorrow as next
          if (!next) {
            next = {
              name: 'Fajr',
              time: timings.Fajr,
              timeRemaining: 'Tomorrow',
            };
          }

          setNextPrayer(next);
          setPrayerTimes(orderedPrayers.map((p) => ({ ...p, isNext: p.name === next?.name })));

          // Qiyam time (time until Fajr)
          const [fajrHours, fajrMinutes] = timings.Fajr.split(':').map(Number);
          const fajrTime = new Date(now);
          fajrTime.setHours(fajrHours, fajrMinutes, 0, 0);
          if (fajrTime <= now) {
            fajrTime.setDate(fajrTime.getDate() + 1);
          }
          const qiyamDiff = fajrTime.getTime() - now.getTime();
          const qiyamHours = Math.floor(qiyamDiff / (1000 * 60 * 60));
          const qiyamMinutes = Math.floor((qiyamDiff % (1000 * 60 * 60)) / (1000 * 60));
          setQiyamTimeRemaining(`${qiyamHours}h${qiyamMinutes}m`);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const resolveCoordsAndFetch = async () => {
      if (currentCoords) {
        await fetchPrayerTimes(currentCoords.lat, currentCoords.lng);
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        if (mounted) {
          setCurrentCoords({ lat: latitude, lng: longitude });
          await fetchPrayerTimes(latitude, longitude);
        }
      } catch (error) {
        console.error('Error resolving location:', error);
        if (mounted) setLoading(false);
      }
    };

    resolveCoordsAndFetch();

    return () => {
      mounted = false;
    };
  }, [currentCoords?.lat, currentCoords?.lng, language, method]);

  return {
    coords: currentCoords,
    prayerTimes,
    nextPrayer,
    hijriDate,
    gregorianDate,
    qiyamTimeRemaining,
    loading,
  };
}
