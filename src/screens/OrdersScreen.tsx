import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import type { Order } from '../types'

type Props = {
  orders: Order[]
}

const OrdersScreen = ({ orders }: Props) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Order history</Text>
          <Text style={textStyles.muted}>Track order status and delivery progress.</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {orders.map((order) => (
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
        {!orders.length && <Text style={textStyles.muted}>No orders yet.</Text>}
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
