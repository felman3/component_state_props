import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CounterDisplay } from '@/components/counter-display';

const BASE_COUNT = 100;
const MILESTONE_STEP = 25;

export default function HomeScreen() {
  const [count, setCount] = useState(BASE_COUNT);
  const [highest, setHighest] = useState(BASE_COUNT);
  const [lowest, setLowest] = useState(BASE_COUNT);
  const [resets, setResets] = useState(0);
  const [milestone, setMilestone] = useState<{ text: string; positive: boolean } | null>(null);

  const milestoneTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMilestoneRef = useRef(BASE_COUNT);
  const bannerOpacity = useRef(new Animated.Value(0)).current;


  const handleAdd = useCallback((step: number) => {
    setCount((prev) => {
      const next = prev + step;
      setHighest((h) => Math.max(h, next));
      return next;
    });
  }, []);

  const handleMinus = useCallback((step: number) => {
    setCount((prev) => {
      const next = prev - step;
      setLowest((l) => Math.min(l, next));
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setCount(BASE_COUNT);
    setResets((r) => r + 1);
    lastMilestoneRef.current = BASE_COUNT;
  }, []);


  useEffect(() => {
    const crossedUp = Math.floor(count / MILESTONE_STEP) !== Math.floor(lastMilestoneRef.current / MILESTONE_STEP);
    if (crossedUp && count !== BASE_COUNT) {
      lastMilestoneRef.current = count;
      const above = count > BASE_COUNT;
      setMilestone({ text: above ? `🚀 PALDOOOOOOOOOOO ${count}` : `⚠️ NYEEEEEEKKKKK ${count}`, positive: above });
      Haptics.notificationAsync(
        above ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );

      Animated.sequence([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(1100),
        Animated.timing(bannerOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      if (milestoneTimeout.current) clearTimeout(milestoneTimeout.current);
      milestoneTimeout.current = setTimeout(() => setMilestone(null), 1600);
    } else {
      lastMilestoneRef.current = count;
    }
  }, [count, bannerOpacity]);

  useEffect(() => {
    return () => {
      if (milestoneTimeout.current) clearTimeout(milestoneTimeout.current);
    };
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>PABILISAN!</Text>
      </View>
      

      {milestone && (
        <Animated.View
          style={[
            styles.milestoneBanner,
            { opacity: bannerOpacity, backgroundColor: milestone.positive ? '#16A34A' : '#B91C1C' },
          ]}>
          <Text style={styles.milestoneText}>{milestone.text}</Text>
        </Animated.View>
      )}

      <CounterDisplay
        count={count}
        baseCount={BASE_COUNT}
        highest={highest}
        lowest={lowest}
        resets={resets}
        onAdd={handleAdd}
        onMinus={handleMinus}
        onReset={handleReset}
      />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 60,
    gap: 14,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 380,
    gap: 14,
  },
  headerBadge: {
    alignSelf: 'center',
    backgroundColor: '#7C2D12',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: '#FED7AA',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  milestoneBanner: {
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  milestoneText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
});
