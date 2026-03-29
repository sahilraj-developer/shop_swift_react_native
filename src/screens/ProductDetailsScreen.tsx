import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { fetchOrders, fetchProductById, fetchReviews, submitReview } from '../api'
import type { AuthUser } from '../api'
import type { Review } from '../types'
import { useCart } from '../cart'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import SkeletonBlock from '../components/Skeleton'
import { trackError } from '../telemetry'

type Props = {
  id: string
  token: string | null
  user: AuthUser | null
  onCheckout: () => void
}

const ProductDetailsScreen = ({ id, token, user, onCheckout }: Props) => {
  const { addToCart } = useCart()
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [productPrice, setProductPrice] = useState(0)
  const [productInventory, setProductInventory] = useState(0)
  const [productStatus, setProductStatus] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [rating, setRating] = useState('5')
  const [comment, setComment] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaImages, setMediaImages] = useState<string[]>([])
  const [mediaVideos, setMediaVideos] = useState<string[]>([])
  const [hasPurchased, setHasPurchased] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const existingReview = useMemo(
    () => reviews.find((review) => review.customerId === user?.id),
    [reviews, user?.id]
  )

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const product = await fetchProductById(id)
      if (!product) {
        setLoading(false)
        return
      }
      setProductName(product.name)
      setProductDescription(product.description)
      setProductPrice(product.price)
      setProductInventory(product.inventory)
      setProductStatus(product.status)
      setImages(product.images ?? [])

      const reviewData = await fetchReviews(id)
      setReviews(reviewData)

      if (token && user?.role === 'customer') {
        const orders = await fetchOrders(token)
        const purchased = orders.some((order) =>
          order.items.some((item) => item.productId === id)
        )
        setHasPurchased(purchased)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load product.')
      trackError(error, 'loadProductDetails')
    } finally {
      setLoading(false)
    }
  }, [id, token, user?.role])

  useEffect(() => {
    loadProduct()
  }, [loadProduct])

  useEffect(() => {
    if (existingReview) {
      setRating(String(existingReview.rating))
      setComment(existingReview.comment)
      setMediaImages(existingReview.images ?? [])
      setMediaVideos(existingReview.videos ?? [])
    }
  }, [existingReview])

  const addImage = () => {
    if (!imageUrl) return
    setMediaImages((prev) => [...prev, imageUrl])
    setImageUrl('')
  }

  const addVideo = () => {
    if (!videoUrl) return
    setMediaVideos((prev) => [...prev, videoUrl])
    setVideoUrl('')
  }

  const handleSubmitReview = async () => {
    if (!token) return
    const numericRating = Number(rating)
    try {
      await submitReview(
        id,
        token,
        {
          rating: Number.isFinite(numericRating) ? numericRating : 5,
          comment,
          images: mediaImages,
          videos: mediaVideos,
        },
        existingReview?._id
      )
      const updated = await fetchReviews(id)
      setReviews(updated)
      Alert.alert('Review saved', 'Thanks for sharing your feedback.')
    } catch (error) {
      Alert.alert('Review failed', error instanceof Error ? error.message : 'Try again')
    }
  }

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.detailCard}>
          <SkeletonBlock height={260} radius={18} />
          <View style={styles.info}>
            <SkeletonBlock height={10} width="30%" />
            <SkeletonBlock height={20} width="70%" />
            <SkeletonBlock height={12} width="90%" />
            <SkeletonBlock height={18} width="40%" />
            <View style={styles.actions}>
              <SkeletonBlock height={40} width={140} radius={999} />
              <SkeletonBlock height={40} width={140} radius={999} />
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  if (errorMessage) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ErrorState title="Product unavailable" description={errorMessage} onAction={loadProduct} />
      </ScrollView>
    )
  }

  if (!productName) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <EmptyState title="Product not found" description="This item may have been removed or is pending approval." />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.detailCard}>
        <View style={styles.gallery}>
          <View style={styles.galleryMain}>
            {images[activeImage] ? (
              <Image source={{ uri: images[activeImage] }} style={styles.galleryImage} />
            ) : (
              <Text style={styles.placeholder}>No image</Text>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {images.length ? (
              images.map((img, index) => (
                <Pressable
                  key={img}
                  style={[styles.thumb, index === activeImage ? styles.thumbActive : undefined]}
                  onPress={() => setActiveImage(index)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} />
                </Pressable>
              ))
            ) : (
              <Text style={textStyles.muted}>Add images to view gallery.</Text>
            )}
          </ScrollView>
        </View>
        <View style={styles.info}>
          <Text style={textStyles.eyebrow}>Vendor verified</Text>
          <Text style={styles.title}>{productName}</Text>
          <Text style={textStyles.muted}>{productDescription}</Text>
          <Text style={styles.price}>${productPrice.toFixed(2)}</Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => {
                addToCart({
                  _id: id,
                  name: productName,
                  description: productDescription,
                  price: productPrice,
                  inventory: productInventory,
                  vendorId: '',
                  status: 'approved',
                  images,
                })
                Alert.alert('Added to cart', productName)
              }}
            >
              <Text style={styles.buttonPrimaryText}>Add to cart</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={onCheckout}>
              <Text style={styles.buttonGhostText}>Go to checkout</Text>
            </Pressable>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>Inventory: {productInventory}</Text>
            <Text style={styles.metaText}>Status: {productStatus}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Customer reviews</Text>
            <Text style={textStyles.muted}>Verified buyers only.</Text>
          </View>
        </View>
        <View style={styles.reviewGrid}>
          {reviews.map((review) => (
            <View style={styles.reviewCard} key={review._id}>
              <Text style={styles.reviewRating}>{review.rating} / 5</Text>
              <Text>{review.comment}</Text>
              {(review.images?.length || review.videos?.length) && (
                <View style={styles.mediaGrid}>
                  {review.images?.map((img) => (
                    <Image key={img} source={{ uri: img }} style={styles.mediaThumb} />
                  ))}
                  {review.videos?.map((video) => (
                    <View key={video} style={styles.mediaThumb}>
                      <Text style={styles.mediaLabel}>Video</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          {!reviews.length && <Text style={textStyles.muted}>No reviews yet.</Text>}
        </View>

        {user?.role === 'customer' && hasPurchased && (
          <View style={styles.reviewForm}>
            <Text style={styles.sectionTitle}>{existingReview ? 'Update your review' : 'Leave a review'}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Rating</Text>
              <TextInput
                style={styles.input}
                value={rating}
                onChangeText={setRating}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Comment</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={comment}
                onChangeText={setComment}
                multiline
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Image URL</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://"
                />
                <Pressable style={[styles.button, styles.buttonGhost]} onPress={addImage}>
                  <Text style={styles.buttonGhostText}>Add</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Video URL</Text>
              <View style={styles.row}>
                <TextInput
                  style={styles.input}
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                  placeholder="https://"
                />
                <Pressable style={[styles.button, styles.buttonGhost]} onPress={addVideo}>
                  <Text style={styles.buttonGhostText}>Add</Text>
                </Pressable>
              </View>
            </View>
            {(mediaImages.length || mediaVideos.length) && (
              <View style={styles.mediaGrid}>
                {mediaImages.map((img) => (
                  <Image key={img} source={{ uri: img }} style={styles.mediaThumb} />
                ))}
                {mediaVideos.map((video) => (
                  <View key={video} style={styles.mediaThumb}>
                    <Text style={styles.mediaLabel}>Video</Text>
                  </View>
                ))}
              </View>
            )}
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleSubmitReview}>
              <Text style={styles.buttonPrimaryText}>
                {existingReview ? 'Update review' : 'Submit review'}
              </Text>
            </Pressable>
          </View>
        )}
        {user?.role === 'customer' && !hasPurchased && (
          <Text style={textStyles.muted}>Purchase this product to leave a review.</Text>
        )}
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
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.soft,
  },
  gallery: {
    gap: spacing.sm,
  },
  galleryMain: {
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(16,16,16,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbRow: {
    flexGrow: 0,
  },
  thumb: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: spacing.sm,
    padding: 2,
  },
  thumbActive: {
    borderColor: colors.sage,
  },
  thumbImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  placeholder: {
    color: 'rgba(16,16,16,0.5)',
  },
  info: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(16,16,16,0.3)',
  },
  buttonGhostText: {
    color: colors.ink,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  reviewGrid: {
    gap: spacing.md,
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  mediaGrid: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mediaThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(16,16,16,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  reviewRating: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  reviewForm: {
    gap: spacing.md,
    maxWidth: 520,
  },
  field: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
})

export default ProductDetailsScreen
