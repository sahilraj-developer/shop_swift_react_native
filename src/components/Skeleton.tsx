import { Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useEffect, useRef } from 'react'
import { colors } from '../theme'

type Props = {
  height?: number
  width?: number | string
  style?: StyleProp<ViewStyle>
  radius?: number
}

const SkeletonBlock = ({ height = 14, width = '100%', style, radius = 12 }: Props) => {
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        styles.block,
        {
          height,
          width,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.border,
  },
})

export default SkeletonBlock
