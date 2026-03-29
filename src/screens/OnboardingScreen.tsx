import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useMemo, useRef, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { trackEvent } from '../telemetry'

type Props = {
  onFinish: () => void
}

type Slide = {
  id: string
  eyebrow: string
  title: string
  description: string
  accent: string
}

const OnboardingScreen = ({ onFinish }: Props) => {
  const { width } = useWindowDimensions()
  const listRef = useRef<FlatList<Slide>>(null)
  const [index, setIndex] = useState(0)

  const slides = useMemo<Slide[]>(
    () => [
      {
        id: 'discover',
        eyebrow: 'Discover',
        title: 'Curated drops from verified vendors.',
        description: 'Browse the latest collections, filter by category, and save what you love.',
        accent: colors.sage,
      },
      {
        id: 'checkout',
        eyebrow: 'Checkout',
        title: 'Secure checkout with flexible delivery.',
        description: 'Pay how you want, track every order, and request refunds in-app.',
        accent: colors.sky,
      },
      {
        id: 'support',
        eyebrow: 'Support',
        title: 'Stay in the loop with instant updates.',
        description: 'Get notifications, reach support fast, and manage everything from your phone.',
        accent: colors.peach,
      },
    ],
    []
  )

  const goNext = () => {
    if (index >= slides.length - 1) {
      trackEvent('onboarding_complete')
      onFinish()
      return
    }
    trackEvent('onboarding_next', { step: index + 1 })
    listRef.current?.scrollToIndex({ index: index + 1, animated: true })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ShopSwift</Text>
        <Pressable
          onPress={() => {
            trackEvent('onboarding_skip', { step: index })
            onFinish()
          }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width)
          setIndex(nextIndex)
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.hero, { backgroundColor: item.accent }]}>
              <View style={styles.heroInset} />
            </View>
            <Text style={textStyles.eyebrow}>{item.eyebrow}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={textStyles.subheading}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[styles.dot, dotIndex === index ? styles.dotActive : undefined]}
            />
          ))}
        </View>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={goNext}>
          <Text style={styles.buttonPrimaryText}>{index === slides.length - 1 ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,16,16,0.2)',
    backgroundColor: 'white',
  },
  skipText: {
    color: colors.ink,
    fontWeight: '600',
  },
  slide: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    height: 240,
    borderRadius: 28,
    marginBottom: spacing.md,
    ...shadows.soft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInset: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(16,16,16,0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.sage,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  buttonPrimaryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
})

export default OnboardingScreen
