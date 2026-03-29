import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useCallback, useEffect, useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { createSupportTicket, fetchSupportTickets } from '../api'
import type { SupportTicket } from '../types'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import SkeletonBlock from '../components/Skeleton'
import { trackError } from '../telemetry'

type Props = {
  token: string | null
}

const SupportScreen = ({ token }: Props) => {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setErrorMessage(null)
      const result = await fetchSupportTickets(token)
      setTickets(result)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load tickets.')
      trackError(error, 'loadSupportTickets')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const submit = async () => {
    if (!token) return
    try {
      await createSupportTicket(token, subject, message)
      setSubject('')
      setMessage('')
      await load()
      Alert.alert('Request sent', 'Our support team will reply soon.')
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Try again')
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Support center</Text>
          <Text style={textStyles.muted}>Share issues, questions, or delivery requests.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Subject</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>
        <Pressable style={[styles.button, styles.buttonPrimary]} onPress={submit}>
          <Text style={styles.buttonPrimaryText}>Submit request</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.title}>Your tickets</Text>
          <Text style={textStyles.muted}>Track responses from the team.</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {loading && (
          <>
            {Array.from({ length: 2 }, (_, index) => (
              <View style={styles.ticket} key={`skeleton-${index}`}>
                <SkeletonBlock height={10} width="30%" />
                <SkeletonBlock height={12} width="70%" />
                <SkeletonBlock height={10} width="90%" />
              </View>
            ))}
          </>
        )}
        {!loading && errorMessage && (
          <ErrorState title="Tickets unavailable" description={errorMessage} onAction={load} />
        )}
        {!loading && !errorMessage && tickets.length === 0 && (
          <EmptyState title="No tickets yet" description="Submit a request and we'll follow up here." />
        )}
        {!loading &&
          !errorMessage &&
          tickets.map((ticket) => (
            <View style={styles.ticket} key={ticket._id}>
              <Text style={styles.ticketTag}>{ticket.status}</Text>
              <Text style={styles.ticketTitle}>{ticket.subject}</Text>
              <Text style={textStyles.muted}>{ticket.message}</Text>
              {ticket.replies?.map((reply, index) => (
                <Text style={textStyles.muted} key={`${ticket._id}-${index}`}>
                  {reply.byRole}: {reply.message}
                </Text>
              ))}
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
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.soft,
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
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  grid: {
    gap: spacing.md,
  },
  ticket: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    ...shadows.soft,
  },
  ticketTag: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    color: colors.sage,
    fontWeight: '700',
  },
  ticketTitle: {
    fontWeight: '600',
    color: colors.ink,
  },
})

export default SupportScreen
