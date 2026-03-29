import { StyleSheet, Text, View } from 'react-native'
import { colors, spacing } from '../theme'

type Props = {
  name: string
  role?: string
}

const CustomerNav = ({ name, role = 'customer' }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Text style={styles.badge}>ShopSwift</Text>
        <View>
          <Text style={styles.title}>E-Commerce Command</Text>
          <Text style={styles.subtitle}>Customer portal</Text>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {name} - {role}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(246, 243, 238, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    backgroundColor: colors.stone,
    color: 'white',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontWeight: '600',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  actionsRow: {
    gap: spacing.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,16,16,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    color: colors.ink,
  },
})

export default CustomerNav
