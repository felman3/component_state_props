import * as Haptics from 'expo-haptics';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';


type CounterDisplayProps = {
  count: number;
  baseCount: number;
  highest: number;
  lowest: number;
  resets: number;
  onAdd: (step: number) => void;
  onMinus: (step: number) => void;
  onReset: () => void;
};

const TIERS = [
  { afterMs: 0, step: 1, tickMs: 130, label: 'x1' },
  { afterMs: 600, step: 2, tickMs: 100, label: 'x2' },
  { afterMs: 1500, step: 3, tickMs: 80, label: 'x3' },
  { afterMs: 3000, step: 5, tickMs: 55, label: 'x5 TURBO' },
];

function getTier(elapsedMs: number) {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (elapsedMs >= t.afterMs) tier = t;
  }
  return tier;
}

export function CounterDisplay({
  count,
  baseCount,
  highest,
  lowest,
  resets,
  onAdd,
  onMinus,
  onReset,
}: CounterDisplayProps) {
  const [turboLabel, setTurboLabel] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<'add' | 'minus' | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const addVideo = useVideoPlayer(require('../assets/mp4/Flight reacts dolphin laugh.mp4'), (player) => {
    player.loop = true;
  });
  const minusVideo = useVideoPlayer(require('../assets/mp4/OIIAOIIA CAT but in 4K (Not Actually).mp4'), (player) => {
    player.loop = true;
  });

  const clearHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    holdStartRef.current = null;
    setTurboLabel(null);
    setActiveVideo(null);
    addVideo.pause();
    addVideo.currentTime = 0;
    minusVideo.pause();
    minusVideo.currentTime = 0;
  }, [addVideo, minusVideo]);

  useEffect(() => clearHold, [clearHold]);

  const bump = useCallback(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [scale]);

  const startHold = useCallback(
    (direction: 1 | -1) => {
      holdStartRef.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const video = direction === 1 ? addVideo : minusVideo;
      setActiveVideo(direction === 1 ? 'add' : 'minus');
      video.currentTime = 0;
      video.play();

      const tick = () => {
        const elapsed = Date.now() - (holdStartRef.current ?? Date.now());
        const tier = getTier(elapsed);
        setTurboLabel(tier.label);
        if (direction === 1) onAdd(tier.step);
        else onMinus(tier.step);
        bump();
        timeoutRef.current = setTimeout(tick, tier.tickMs);
      };
      tick();
    },
    [onAdd, onMinus, bump, addVideo, minusVideo]
  );

  const diff = count - baseCount;
  const diffLabel = diff === 0 ? 'EVEN' : diff > 0 ? `+${diff}` : `${diff}`;
  const numberColor = diff === 0 ? '#E2E8F0' : diff > 0 ? '#4ADE80' : '#F87171';


  const gaugePct = Math.min(100, Math.max(0, (count / (baseCount * 2)) * 100));

  return (
    <View style={styles.card}>
      <View style={[styles.videoPopup, activeVideo === 'add' ? null : styles.videoPopupHidden]}>
        <VideoView
          style={styles.videoPlayer}
          player={addVideo}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
        />
        <Text style={styles.videoPopupLabel}>🐬 Dolphin Laugh</Text>
      </View>
      <View style={[styles.videoPopup, activeVideo === 'minus' ? null : styles.videoPopupHidden]}>
        <VideoView
          style={styles.videoPlayer}
          player={minusVideo}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
        />
        <Text style={styles.videoPopupLabel}>🐱 OIIAOIIA</Text>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>GAME!!</Text>
      </View>

      <View style={styles.propsRow}>
      </View>

      <Animated.Text style={[styles.count, { color: numberColor, transform: [{ scale }] }]}>
        {count}
      </Animated.Text>

      <View style={styles.metaRow}>
        {turboLabel && (
          <Text style={styles.turboPill}>⚡ {turboLabel}</Text>
        )}
      </View>

      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: `${gaugePct}%` }]} />
        <View style={styles.gaugeMidline} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🏆 {highest}</Text>
          <Text style={styles.statLabel}>High Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>💀 {lowest}</Text>
          <Text style={styles.statLabel}>Low Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔄 {resets}</Text>
          <Text style={styles.statLabel}>Resets</Text>
        </View>
      </View>

      <View style={styles.propsRow}>
      </View>

      <Pressable
        onPressIn={() => startHold(1)}
        onPressOut={clearHold}
        style={({ pressed }) => [styles.button, styles.addButton, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>＋ Add Count</Text>
      </Pressable>

      <Pressable
        onPressIn={() => startHold(-1)}
        onPressOut={clearHold}
        style={({ pressed }) => [styles.button, styles.minusButton, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>－ Minus Count</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onReset();
        }}
        style={({ pressed }) => [styles.button, styles.resetButton, pressed && styles.buttonPressed]}>
        <Text style={styles.buttonText}>⟲ Reset Count</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  videoPopupHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  videoPopup: {
    position: 'absolute',
    top: -28,
    right: -12,
    width: 130,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FACC15',
    padding: 6,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  videoPlayer: {
    width: 116,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#000',
  },
  videoPopupLabel: {
    color: '#FACC15',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#312E81',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 4,
  },
  badgeText: {
    color: '#C7D2FE',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  propsRow: {
    alignItems: 'center',
  },
  propsLabel: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  count: {
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  diffPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  turboPill: {
    backgroundColor: '#FACC15',
    color: '#1E293B',
    fontWeight: '800',
    fontSize: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gaugeTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gaugeFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#38BDF8',
  },
  gaugeMidline: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#475569',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#F1F5F9',
    fontWeight: '700',
    fontSize: 14,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  addButton: {
    backgroundColor: '#A21CAF',
  },
  minusButton: {
    backgroundColor: '#DC2626',
  },
  resetButton: {
    backgroundColor: '#475569',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 17,
  },
  buttonHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
});
