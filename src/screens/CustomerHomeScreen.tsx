import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { fetchApprovedProducts, fetchCategories, fetchOrders, requestRefund } from '../api'
import type { Category, Order, Product } from '../types'
import CustomerNav from '../components/CustomerNav'
import { useCart } from '../cart'

type Props = {
  name: string
  token: string | null
  onLogout: () => void
  onCheckout: () => void
  onNotifications: () => void
  onOpenProduct: (id: string) => void
}

const CustomerHomeScreen = ({ name, token, onLogout, onCheckout, onNotifications, onOpenProduct }: Props) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [category, setCategory] = useState('')
  const [inStock, setInStock] = useState(false)
  const { addToCart } = useCart()
  const { width } = useWindowDimensions()
  const columns = width > 420 ? 2 : 1

  const query = useMemo(() => {
    const params: string[] = []
    if (search) params.push(`search=${encodeURIComponent(search)}`)
    if (minPrice) params.push(`minPrice=${encodeURIComponent(minPrice)}`)
    if (maxPrice) params.push(`maxPrice=${encodeURIComponent(maxPrice)}`)
    if (category) params.push(`category=${encodeURIComponent(category)}`)
    if (inStock) params.push('inStock=true')
    return params.length ? `&${params.join('&')}` : ''
  }, [search, minPrice, maxPrice, category, inStock])

  const loadProducts = useCallback(async () => {
    try {
      const result = await fetchApprovedProducts(query)
      setProducts(result)
    } catch {
      setProducts([])
    }
  }, [query])

  const loadCategories = useCallback(async () => {
    const result = await fetchCategories()
    setCategories(result)
  }, [])

  const loadOrders = useCallback(async () => {
    if (!token) return
    const result = await fetchOrders(token)
    setOrders(result)
  }, [token])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([loadProducts(), loadCategories(), loadOrders()])
      setLoading(false)
    }
    load()
  }, [loadCategories, loadOrders, loadProducts])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadProducts(), loadOrders()])
    setRefreshing(false)
  }, [loadOrders, loadProducts])

  const listHeader = useMemo(
    () => (
      <View>
        <CustomerNav name={name} />
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={textStyles.eyebrow}>ShopSwift storefront</Text>
            <Text style={styles.heroTitle}>Discover products curated by verified vendors.</Text>
            <Text style={textStyles.subheading}>
              Browse approved listings, check real reviews, and check out in a few taps.
            </Text>
          </View>
          <View style={styles.heroPanel}>
            <Text style={styles.panelLabel}>Live catalog</Text>
            <Text style={styles.panelValue}>{products.length} products ready to ship</Text>
            <Text style={textStyles.muted}>Only admin-approved items are visible.</Text>
          </View>
        </View>

        <View style={styles.filters}>
          <Text style={styles.sectionTitle}>Filters</Text>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Search products"
            placeholderTextColor="rgba(16,16,16,0.4)"
          />
          <View style={styles.filterRow}>
            <TextInput
              style={styles.input}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Min price"
              keyboardType="numeric"
              placeholderTextColor="rgba(16,16,16,0.4)"
            />
            <TextInput
              style={styles.input}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max price"
              keyboardType="numeric"
              placeholderTextColor="rgba(16,16,16,0.4)"
            />
          </View>
          <View style={styles.filterRow}>
            <View style={styles.chipGroup}>
              <Pressable
                style={[styles.filterChip, !inStock ? styles.filterChipActive : undefined]}
                onPress={() => setInStock(false)}
              >
                <Text style={styles.filterChipText}>All stock</Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, inStock ? styles.filterChipActive : undefined]}
                onPress={() => setInStock(true)}
              >
                <Text style={styles.filterChipText}>In stock</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.categoryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipGroup}>
                <Pressable
                  style={[styles.filterChip, category === '' ? styles.filterChipActive : undefined]}
                  onPress={() => setCategory('')}
                >
                  <Text style={styles.filterChipText}>All categories</Text>
                </Pressable>
                {categories.map((item) => (
                  <Pressable
                    key={item._id}
                    style={[styles.filterChip, category === item.name ? styles.filterChipActive : undefined]}
                    onPress={() => setCategory(item.name)}
                  >
                    <Text style={styles.filterChipText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Customer picks</Text>
            <Text style={textStyles.muted}>Tap a product to view details, images, and reviews.</Text>
          </View>
        </View>
        {loading && <Text style={textStyles.muted}>Loading products...</Text>}
      </View>
    ),
    [category, categories, inStock, loading, maxPrice, minPrice, name, products.length, search]
  )

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={products}
      key={columns}
      numColumns={columns}
      keyExtractor={(item) => item._id}
      columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
      ListHeaderComponent={listHeader}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View style={[styles.card, columns > 1 ? styles.cardHalf : undefined]}>
          <View style={styles.imageWrap}>
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.image} />
            ) : (
              <Text style={styles.placeholder}>No image</Text>
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTag}>{item.category ?? 'General'}</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMuted}>{item.description}</Text>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable style={[styles.button, styles.buttonMini]} onPress={() => onOpenProduct(item._id)}>
              <Text style={styles.buttonMiniText}>View</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.buttonGhost]}
              onPress={() => {
                addToCart(item)
                Alert.alert('Added to cart', item.name)
              }}
            >
              <Text style={styles.buttonGhostText}>Add to cart</Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={!loading ? <Text style={textStyles.muted}>No products yet.</Text> : null}
      ListFooterComponent={
        <View style={styles.footer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery & refunds</Text>
          </View>
          {orders.slice(0, 3).map((order) => (
            <View style={styles.card} key={order._id}>
              <Text style={styles.cardTag}>Order #{order._id.slice(-6)}</Text>
              <Text style={styles.cardMuted}>Delivery: {order.deliveryStatus ?? 'processing'}</Text>
              <Text style={styles.cardMuted}>Refund: {order.refundStatus ?? 'none'}</Text>
              <Text style={styles.price}>${order.total.toFixed(2)}</Text>
              {token && order.refundStatus === 'none' && (
                <Pressable
                  style={[styles.button, styles.buttonGhost]}
                  onPress={async () => {
                    await requestRefund(token, order._id, 'Customer requested refund in app.')
                    Alert.alert('Refund requested', 'We will review your request shortly.')
                    await loadOrders()
                  }}
                >
                  <Text style={styles.buttonGhostText}>Request refund</Text>
                </Pressable>
              )}
            </View>
          ))}
          {!orders.length && <Text style={textStyles.muted}>Log in to see delivery updates.</Text>}
          <View style={styles.supportCard}>
            <Text style={styles.sectionTitle}>Need help?</Text>
            <Text style={textStyles.muted}>Contact support for delivery or refund questions.</Text>
            <View style={styles.supportActions}>
              <Pressable style={[styles.button, styles.buttonPrimary]} onPress={onNotifications}>
                <Text style={styles.buttonPrimaryText}>Notifications</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCheckout}>
                <Text style={styles.buttonGhostText}>Checkout</Text>
              </Pressable>
              <Pressable style={[styles.button, styles.buttonGhost]} onPress={onLogout}>
                <Text style={styles.buttonGhostText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    gap: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
  },
  heroPanel: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
  },
  panelLabel: {
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 2.2,
    color: 'rgba(16,16,16,0.55)',
  },
  panelValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  filters: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryRow: {
    marginTop: spacing.sm,
  },
  chipGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,16,16,0.2)',
    backgroundColor: 'white',
  },
  filterChipActive: {
    backgroundColor: 'rgba(47,93,80,0.12)',
    borderColor: 'rgba(47,93,80,0.3)',
  },
  filterChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  cardHalf: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 150,
    backgroundColor: 'rgba(16, 16, 16, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    color: 'rgba(16,16,16,0.5)',
  },
  cardBody: {
    gap: spacing.xs,
  },
  cardTag: {
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.sage,
    fontWeight: '700',
  },
  cardTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
  cardMuted: {
    color: 'rgba(16,16,16,0.6)',
  },
  price: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.ink,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  buttonMini: {
    backgroundColor: 'white',
    borderColor: 'rgba(16, 16, 16, 0.2)',
  },
  buttonMiniText: {
    color: colors.ink,
    fontWeight: '600',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(16,16,16,0.3)',
  },
  buttonGhostText: {
    color: colors.ink,
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  buttonPrimaryText: {
    color: 'white',
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.ink,
    flex: 1,
  },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  supportCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  supportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
})

export default CustomerHomeScreen
