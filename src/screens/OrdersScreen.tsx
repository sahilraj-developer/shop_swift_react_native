import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import type { Order } from '../types'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import SkeletonBlock from '../components/Skeleton'

type Props = {
  orders: Order[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

const OrdersScreen = ({ orders, loading = false, error, onRetry }: Props) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Order history</Text>
          <Text style={textStyles.muted}>Track order status and delivery progress.</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {loading && (
          <>
            {Array.from({ length: 3 }, (_, index) => (
              <View style={styles.card} key={`skeleton-${index}`}>
                <SkeletonBlock height={10} width="40%" />
                <SkeletonBlock height={10} width="70%" />
                <SkeletonBlock height={10} width="60%" />
                <SkeletonBlock height={14} width="30%" />
              </View>
            ))}
          </>
        )}
        {!loading && error && <ErrorState title="Orders unavailable" description={error} onAction={onRetry} />}
        {!loading && !error && orders.length === 0 && (
          <EmptyState title="No orders yet" description="Place your first order to see it here." />
        )}
        {!loading &&
          !error &&
          orders.map((order) => (
            <View style={styles.card} key={order._id}>
              <Text style={styles.tag}>Order #{order._id.slice(-6)}</Text>
              <Text style={textStyles.muted}>Payment: {order.paymentMethod ?? 'card'}</Text>
              <Text style={textStyles.muted}>Payment status: {order.paymentStatus ?? 'pending'}</Text>
              <Text style={textStyles.muted}>Delivery: {order.deliveryStatus ?? 'processing'}</Text>
              <Text style={textStyles.muted}>Refund: {order.refundStatus ?? 'none'}</Text>
              <Text style={styles.price}>${order.total.toFixed(2)}</Text>
              {order.deliveryAddress?.line1 && (
                <Text style={textStyles.muted}>
                  Deliver to: {order.deliveryAddress.line1}, {order.deliveryAddress.city}
                </Text>
              )}
            </View>
          ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  grid: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.soft,
  },
  tag: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    color: colors.sage,
    fontWeight: '700',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
})

export default OrdersScreen
