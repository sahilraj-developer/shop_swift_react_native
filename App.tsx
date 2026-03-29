import { useEffect, useRef, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { enableScreens } from 'react-native-screens'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoginScreen from './src/screens/LoginScreen'
import CustomerHomeScreen from './src/screens/CustomerHomeScreen'
import { colors } from './src/theme'
import { CartProvider } from './src/cart'
import ProductDetailsScreen from './src/screens/ProductDetailsScreen'
import CheckoutScreen from './src/screens/CheckoutScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import SupportScreen from './src/screens/SupportScreen'
import type { AuthUser } from './src/api'
import { fetchOrders } from './src/api'
import type { Order } from './src/types'
import OrdersScreen from './src/screens/OrdersScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import { initTelemetry, installGlobalErrorHandler, trackScreen } from './src/telemetry'

type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  Main: undefined
}

type HomeStackParamList = {
  Home: undefined
  ProductDetails: { id: string }
}

type TabParamList = {
  Storefront: undefined
  Orders: undefined
  Checkout: undefined
  Notifications: undefined
  Support: undefined
}

const RootStack = createNativeStackNavigator<RootStackParamList>()
const HomeStack = createNativeStackNavigator<HomeStackParamList>()
const Tabs = createBottomTabNavigator<TabParamList>()
enableScreens()

const headerBase = {
  headerStyle: { backgroundColor: colors.sand },
  headerTitleStyle: { color: colors.ink },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
}

const App = () => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const navigationRef = useRef<any>(null)
  const routeNameRef = useRef<string | undefined>(undefined)

  const logout = () => {
    setToken(null)
    setUser(null)
    setOrders([])
    setOrdersLoading(false)
    setOrdersError(null)
  }

  useEffect(() => {
    initTelemetry()
    installGlobalErrorHandler()
  }, [])

  useEffect(() => {
    const loadOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('onboarding_done')
        setOnboardingDone(value === 'true')
      } catch {
        setOnboardingDone(false)
      } finally {
        setBooting(false)
      }
    }
    loadOnboarding()
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        setOrdersLoading(true)
        setOrdersError(null)
        const data = await fetchOrders(token)
        setOrders(data)
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'Unable to load orders.')
      } finally {
        setOrdersLoading(false)
      }
    }
    load()
  }, [token])

  const LogoutButton = () => (
    <Pressable onPress={logout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Log out</Text>
    </Pressable>
  )

  const HomeStackScreen = () => (
    <HomeStack.Navigator screenOptions={headerBase}>
      <HomeStack.Screen
        name="Home"
        options={{ title: 'Storefront', headerRight: () => <LogoutButton /> }}
      >
        {({ navigation }) => (
          <CustomerHomeScreen
            name={user?.name ?? 'Customer'}
            token={token}
            onLogout={logout}
            onCheckout={() => navigation.navigate('Checkout' as never)}
            onNotifications={() => navigation.navigate('Notifications' as never)}
            onOpenProduct={(id) => navigation.navigate('ProductDetails', { id })}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="ProductDetails" options={{ title: 'Product details' }}>
        {({ route, navigation }) => (
          <ProductDetailsScreen
            id={route.params.id}
            token={token}
            user={user}
            onCheckout={() => navigation.navigate('Checkout' as never)}
          />
        )}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  )

  const TabScreen = () => (
    <Tabs.Navigator
      screenOptions={{
        headerShown: true,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: 'rgba(16,16,16,0.6)',
        ...headerBase,
      }}
    >
      <Tabs.Screen
        name="Storefront"
        component={HomeStackScreen}
        options={{ title: 'Storefront', headerShown: false }}
      />
      <Tabs.Screen name="Orders" options={{ title: 'Orders', headerRight: () => <LogoutButton /> }}>
        {() => (
          <OrdersScreen
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            onRetry={async () => {
              if (!token) return
              setOrdersLoading(true)
              setOrdersError(null)
              try {
                const data = await fetchOrders(token)
                setOrders(data)
              } catch (error) {
                setOrdersError(error instanceof Error ? error.message : 'Unable to load orders.')
              } finally {
                setOrdersLoading(false)
              }
            }}
          />
        )}
      </Tabs.Screen>
      <Tabs.Screen name="Checkout" options={{ title: 'Checkout', headerRight: () => <LogoutButton /> }}>
        {() => <CheckoutScreen token={token} email={user?.email ?? ''} addresses={user?.addresses ?? []} />}
      </Tabs.Screen>
      <Tabs.Screen
        name="Notifications"
        options={{ title: 'Notifications', headerRight: () => <LogoutButton /> }}
      >
        {() => <NotificationsScreen token={token} />}
      </Tabs.Screen>
      <Tabs.Screen name="Support" options={{ title: 'Support', headerRight: () => <LogoutButton /> }}>
        {() => <SupportScreen token={token} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  )

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.sand} />
      <CartProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            routeNameRef.current = navigationRef.current?.getCurrentRoute?.()?.name
            if (routeNameRef.current) {
              trackScreen(routeNameRef.current)
            }
          }}
          onStateChange={() => {
            const currentRoute = navigationRef.current?.getCurrentRoute?.()?.name
            if (currentRoute && routeNameRef.current !== currentRoute) {
              trackScreen(currentRoute)
              routeNameRef.current = currentRoute
            }
          }}
        >
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {booting ? (
              <RootStack.Screen name="Onboarding">
                {() => (
                  <View style={styles.loadingScreen}>
                    <Text style={styles.loadingText}>Loading ShopSwift...</Text>
                  </View>
                )}
              </RootStack.Screen>
            ) : !onboardingDone ? (
              <RootStack.Screen name="Onboarding">
                {() => (
                  <OnboardingScreen
                    onFinish={async () => {
                      await AsyncStorage.setItem('onboarding_done', 'true')
                      setOnboardingDone(true)
                    }}
                  />
                )}
              </RootStack.Screen>
            ) : !token ? (
              <RootStack.Screen name="Login">
                {() => (
                  <LoginScreen
                    onSuccess={(nextToken, nextUser) => {
                      setToken(nextToken)
                      setUser(nextUser)
                    }}
                  />
                )}
              </RootStack.Screen>
            ) : (
              <RootStack.Screen name="Main" component={TabScreen} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,16,16,0.3)',
    marginRight: 12,
  },
  logoutText: {
    color: colors.ink,
    fontWeight: '600',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
  loadingText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default App
