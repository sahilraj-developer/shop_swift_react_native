import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../theme'

type Props = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const ErrorState = ({ title, description, actionLabel = 'Try again', onAction }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onAction && (
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onAction}>
          <Text style={styles.buttonPrimaryText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 242, 242, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(200, 64, 64, 0.2)',
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  description: {
    color: 'rgba(16,16,16,0.7)',
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  buttonPrimaryText: {
    color: 'white',
    fontWeight: '700',
  },
})

export default ErrorState
