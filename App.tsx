import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack'
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
import { AppContext, useAppContext } from './src/appContext'

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

const HeaderLogout = () => {
  const { logout } = useAppContext()
  return (
    <Pressable onPress={logout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Log out</Text>
    </Pressable>
  )
}

const BootingScreen = () => (
  <View style={styles.loadingScreen}>
    <Text style={styles.loadingText}>Loading ShopSwift...</Text>
  </View>
)

const LoginRoute = () => {
  const { setAuth } = useAppContext()
  return <LoginScreen onSuccess={setAuth} />
}

const OnboardingRoute = () => {
  const { completeOnboarding } = useAppContext()
  return <OnboardingScreen onFinish={completeOnboarding} />
}

const HomeRoute = ({ navigation }: NativeStackScreenProps<HomeStackParamList, 'Home'>) => {
  const { user, token, logout } = useAppContext()

  const navigateToTab = (tab: keyof TabParamList) => {
    const parent = navigation.getParent()
    parent?.navigate(tab as never)
  }

  return (
    <CustomerHomeScreen
      name={user?.name ?? 'Customer'}
      token={token}
      onLogout={logout}
      onCheckout={() => navigateToTab('Checkout')}
      onNotifications={() => navigateToTab('Notifications')}
      onOpenProduct={(id) => navigation.navigate('ProductDetails', { id })}
    />
  )
}

const ProductDetailsRoute = ({
  route,
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'ProductDetails'>) => {
  const { user, token } = useAppContext()

  const navigateToTab = (tab: keyof TabParamList) => {
    const parent = navigation.getParent()
    parent?.navigate(tab as never)
  }

  return (
    <ProductDetailsScreen
      id={route.params.id}
      token={token}
      user={user}
      onCheckout={() => navigateToTab('Checkout')}
    />
  )
}

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={headerBase}>
    <HomeStack.Screen name="Home" component={HomeRoute} options={{ title: 'Storefront', headerRight: HeaderLogout }} />
    <HomeStack.Screen
      name="ProductDetails"
      component={ProductDetailsRoute}
      options={{ title: 'Product details' }}
    />
  </HomeStack.Navigator>
)

const OrdersRoute = () => {
  const { orders, ordersError, ordersLoading, refreshOrders } = useAppContext()
  return (
    <OrdersScreen orders={orders} loading={ordersLoading} error={ordersError} onRetry={refreshOrders} />
  )
}

const CheckoutRoute = () => {
  const { token, user } = useAppContext()
  return <CheckoutScreen token={token} email={user?.email ?? ''} addresses={user?.addresses ?? []} />
}

const NotificationsRoute = () => {
  const { token } = useAppContext()
  return <NotificationsScreen token={token} />
}

const SupportRoute = () => {
  const { token } = useAppContext()
  return <SupportScreen token={token} />
}

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
    <Tabs.Screen name="Storefront" component={HomeStackScreen} options={{ title: 'Storefront', headerShown: false }} />
    <Tabs.Screen name="Orders" component={OrdersRoute} options={{ title: 'Orders', headerRight: HeaderLogout }} />
    <Tabs.Screen name="Checkout" component={CheckoutRoute} options={{ title: 'Checkout', headerRight: HeaderLogout }} />
    <Tabs.Screen
      name="Notifications"
      component={NotificationsRoute}
      options={{ title: 'Notifications', headerRight: HeaderLogout }}
    />
    <Tabs.Screen name="Support" component={SupportRoute} options={{ title: 'Support', headerRight: HeaderLogout }} />
  </Tabs.Navigator>
)

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

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    setOrders([])
    setOrdersLoading(false)
    setOrdersError(null)
  }, [])

  const setAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('onboarding_done', 'true')
    setOnboardingDone(true)
  }, [])

  const refreshOrders = useCallback(async () => {
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
  }, [token])

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
    refreshOrders()
  }, [refreshOrders])

  const contextValue = useMemo(
    () => ({
      token,
      user,
      orders,
      ordersLoading,
      ordersError,
      setAuth,
      logout,
      refreshOrders,
      completeOnboarding,
    }),
    [token, user, orders, ordersLoading, ordersError, setAuth, logout, refreshOrders, completeOnboarding]
  )

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.sand} />
      <CartProvider>
        <AppContext.Provider value={contextValue}>
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
                <RootStack.Screen name="Onboarding" component={BootingScreen} />
              ) : !onboardingDone ? (
                <RootStack.Screen name="Onboarding" component={OnboardingRoute} />
              ) : !token ? (
                <RootStack.Screen name="Login" component={LoginRoute} />
              ) : (
                <RootStack.Screen name="Main" component={TabScreen} />
              )}
            </RootStack.Navigator>
          </NavigationContainer>
        </AppContext.Provider>
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
