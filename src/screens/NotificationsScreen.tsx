import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { fetchNotifications, markNotificationRead } from '../api'
import type { NotificationItem } from '../types'

type Props = {
  token: string | null
}

const NotificationsScreen = ({ token }: Props) => {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!token) return
    const response = await fetchNotifications(token)
    setItems(response)
  }, [token])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        await loadNotifications()
      } catch (error) {
        Alert.alert('Unable to load notifications', error instanceof Error ? error.message : 'Try again')
      }
    }
    load()
  }, [loadNotifications, token])

  const onRefresh = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      await loadNotifications()
    } finally {
      setRefreshing(false)
    }
  }, [loadNotifications, token])

  const handleRead = async (id: string) => {
    if (!token) return
    try {
      const updated = await markNotificationRead(token, id)
      if (!updated) return
      setItems((prev) => prev.map((item) => (item._id === id ? updated : item)))
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Try again')
    }
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={textStyles.muted}>Updates from admin and order confirmations.</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.notification, item.read ? styles.notificationRead : undefined]}>
          <View style={styles.notificationBody}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text>{item.message}</Text>
          </View>
          {!item.read && (
            <Pressable style={[styles.button, styles.buttonMini]} onPress={() => handleRead(item._id)}>
              <Text style={styles.buttonMiniText}>Mark read</Text>
            </Pressable>
          )}
        </View>
      )}
      ListEmptyComponent={<Text style={textStyles.muted}>No notifications yet.</Text>}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  notification: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  notificationRead: {
    opacity: 0.6,
  },
  notificationBody: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
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
})

export default NotificationsScreen
