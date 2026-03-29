const isDev = typeof __DEV__ !== 'undefined' && __DEV__

let initialized = false

export const initTelemetry = () => {
  if (initialized) return
  initialized = true
  if (isDev) {
    console.log('[telemetry] initialized')
  }
}

export const installGlobalErrorHandler = () => {
  const errorUtils = (global as { ErrorUtils?: { getGlobalHandler?: () => any; setGlobalHandler?: any } })
    .ErrorUtils
  if (!errorUtils?.setGlobalHandler) return
  const defaultHandler = errorUtils.getGlobalHandler?.()
  errorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    trackError(error, isFatal ? 'fatal' : 'nonfatal')
    if (defaultHandler) {
      defaultHandler(error, isFatal)
    }
  })
}

export const trackScreen = (name: string) => {
  if (isDev) {
    console.log(`[telemetry] screen:${name}`)
  }
}

export const trackEvent = (name: string, props: Record<string, string | number | boolean> = {}) => {
  if (isDev) {
    console.log('[telemetry] event', name, props)
  }
}

export const trackError = (error: unknown, context?: string) => {
  if (isDev) {
    console.log('[telemetry] error', context, error)
  }
}
