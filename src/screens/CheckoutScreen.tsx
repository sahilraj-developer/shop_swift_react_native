import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { createCheckoutSession, createOrder, updateAddresses } from '../api'
import { useCart } from '../cart'
import type { Address } from '../types'

type Props = {
  token: string | null
  email: string
  addresses?: Address[]
}

const CheckoutScreen = ({ token, email, addresses: initialAddresses = [] }: Props) => {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart()
  const [receiptEmail, setReceiptEmail] = useState(email)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod' | 'wallet'>('card')
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [form, setForm] = useState<Address>({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    isDefault: true,
  })

  useEffect(() => {
    setAddresses(initialAddresses)
    setSelectedAddress(initialAddresses.find((item) => item.isDefault)?.label ?? initialAddresses[0]?.label ?? '')
  }, [initialAddresses])

  const submitOrder = async () => {
    if (!token) {
      Alert.alert('Login required', 'Please log in to complete purchase')
      return
    }
    if (!items.length) {
      Alert.alert('Cart empty', 'Add a product before checkout')
      return
    }
    try {
      const deliveryAddress = addresses.find((item) => item.label === selectedAddress)
      if (paymentMethod === 'card') {
        const url = await createCheckoutSession(token, items, receiptEmail || email, deliveryAddress)
        clearCart()
        if (url) {
          await Linking.openURL(url)
        } else {
          Alert.alert('Payment error', 'Unable to start Stripe checkout.')
        }
        return
      }
      await createOrder(token, items, receiptEmail || email, paymentMethod, deliveryAddress)
      clearCart()
      Alert.alert('Order placed', 'Your order has been submitted.')
    } catch (error) {
      Alert.alert('Checkout failed', error instanceof Error ? error.message : 'Try again')
    }
  }

  const saveAddress = async () => {
    if (!token) return
    const next = [...addresses, form]
    try {
      await updateAddresses(token, next)
      setAddresses(next)
      setSelectedAddress(form.label)
      setForm({
        label: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        isDefault: true,
      })
      Alert.alert('Address saved', 'You can now use this address for delivery.')
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Try again')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Checkout</Text>
          <Text style={textStyles.muted}>Review your cart and place the order.</Text>
        </View>
      </View>

      <View style={styles.cart}>
        <View style={styles.cartItems}>
          {items.map((item) => (
            <View style={styles.cartItem} key={item.productId}>
              <View>
                <Text style={styles.itemTitle}>{item.name}</Text>
                <Text style={textStyles.muted}>${item.price.toFixed(2)} each</Text>
              </View>
              <View style={styles.controls}>
                <TextInput
                  style={styles.input}
                  value={String(item.quantity)}
                  keyboardType="numeric"
                  onChangeText={(value) => {
                    const next = Number(value)
                    updateQuantity(item.productId, Number.isFinite(next) ? next : 1)
                  }}
                />
                <Pressable style={[styles.button, styles.buttonGhost]} onPress={() => removeFromCart(item.productId)}>
                  <Text style={styles.buttonGhostText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {!items.length && <Text style={textStyles.muted}>Your cart is empty.</Text>}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order summary</Text>
          <Text style={textStyles.muted}>Total items: {items.length}</Text>
          <Text style={styles.price}>${total.toFixed(2)}</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Receipt email</Text>
            <TextInput
              style={styles.input}
              value={receiptEmail}
              onChangeText={setReceiptEmail}
              placeholder="you@email.com"
              placeholderTextColor="rgba(16,16,16,0.4)"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Delivery address</Text>
            <View style={styles.row}>
              {addresses.map((item) => (
                <Pressable
                  key={item.label}
                  style={[styles.chip, selectedAddress === item.label ? styles.chipActive : undefined]}
                  onPress={() => setSelectedAddress(item.label)}
                >
                  <Text style={styles.chipText}>{item.label}</Text>
                </Pressable>
              ))}
              {!addresses.length && <Text style={textStyles.muted}>Add a new address below.</Text>}
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Add new address</Text>
            <View style={styles.addressGrid}>
              <TextInput style={styles.input} placeholder="Label" value={form.label} onChangeText={(value) => setForm((prev) => ({ ...prev, label: value }))} />
              <TextInput style={styles.input} placeholder="Line 1" value={form.line1} onChangeText={(value) => setForm((prev) => ({ ...prev, line1: value }))} />
              <TextInput style={styles.input} placeholder="Line 2" value={form.line2 ?? ''} onChangeText={(value) => setForm((prev) => ({ ...prev, line2: value }))} />
              <TextInput style={styles.input} placeholder="City" value={form.city} onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))} />
              <TextInput style={styles.input} placeholder="State" value={form.state} onChangeText={(value) => setForm((prev) => ({ ...prev, state: value }))} />
              <TextInput style={styles.input} placeholder="Postal" value={form.postalCode} onChangeText={(value) => setForm((prev) => ({ ...prev, postalCode: value }))} />
              <TextInput style={styles.input} placeholder="Country" value={form.country} onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))} />
            </View>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={saveAddress}>
              <Text style={styles.buttonGhostText}>Save address</Text>
            </Pressable>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Payment method</Text>
            <View style={styles.row}>
              {(['card', 'upi', 'wallet', 'cod'] as const).map((method) => (
                <Pressable
                  key={method}
                  style={[styles.chip, paymentMethod === method ? styles.chipActive : undefined]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={styles.chipText}>{method.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable style={[styles.button, styles.buttonPrimary]} onPress={submitOrder}>
            <Text style={styles.buttonPrimaryText}>Place order</Text>
          </Pressable>
        </View>
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
  cart: {
    gap: spacing.lg,
  },
  cartItems: {
    gap: spacing.md,
  },
  cartItem: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  itemTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
  summary: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: 'rgba(16,16,16,0.7)',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    minWidth: 80,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  addressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,16,16,0.2)',
    backgroundColor: 'white',
  },
  chipActive: {
    backgroundColor: 'rgba(47,93,80,0.12)',
    borderColor: 'rgba(47,93,80,0.3)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(16,16,16,0.3)',
  },
  buttonGhostText: {
    color: colors.ink,
    fontWeight: '600',
  },
})

export default CheckoutScreen
