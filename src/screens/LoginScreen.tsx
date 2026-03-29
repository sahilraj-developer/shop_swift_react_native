import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useState } from 'react'
import { colors, spacing, text as textStyles, shadows } from '../theme'
import { loginCustomer, type AuthUser } from '../api'

type Props = {
  onSuccess: (token: string, user: AuthUser) => void
}

const LoginScreen = ({ onSuccess }: Props) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await loginCustomer(email.trim(), password)
      onSuccess(result.token, result.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={textStyles.eyebrow}>Customer access</Text>
          <Text style={styles.title}>Sign in to shop</Text>
          <Text style={textStyles.subheading}>Use email: customer@shopswift.com · password: customer123</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="customer@shopswift.com"
              placeholderTextColor="rgba(16,16,16,0.4)"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor="rgba(16,16,16,0.4)"
            />
          </View>

          {error ? (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}

          <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Continue</Text>}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
    ...shadows.soft,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.ink,
  },
  form: {
    gap: spacing.md,
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
  button: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  alert: {
    backgroundColor: 'rgba(214, 90, 61, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(214, 90, 61, 0.35)',
    padding: spacing.sm,
  },
  alertText: {
    color: '#8b2c1b',
    fontSize: 13,
  },
})

export default LoginScreen
