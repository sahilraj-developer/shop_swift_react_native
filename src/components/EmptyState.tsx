import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, text as textStyles } from '../theme'

type Props = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState = ({ title, description, actionLabel, onAction }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={textStyles.muted}>{description}</Text>
      {actionLabel && onAction && (
        <Pressable style={[styles.button, styles.buttonGhost]} onPress={onAction}>
          <Text style={styles.buttonGhostText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  buttonGhost: {
    borderColor: 'rgba(16,16,16,0.3)',
    backgroundColor: 'transparent',
  },
  buttonGhostText: {
    color: colors.ink,
    fontWeight: '600',
  },
})

export default EmptyState
