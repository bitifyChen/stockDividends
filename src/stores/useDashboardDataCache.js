import { defineStore } from 'pinia'

const DEFAULT_CUTOFF_HOUR = 18
const DEFAULT_CUTOFF_MINUTE = 5
const MAX_CACHE_ENTRIES = 80

const pad2 = (value) => String(value).padStart(2, '0')

const getTaipeiParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23'
  })

  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
}

const getTaipeiVersionDate = (date = new Date()) => {
  const parts = getTaipeiParts(date)
  const hour = Number(parts.hour || 0)
  const minute = Number(parts.minute || 0)
  const isBeforeCutoff =
    hour < DEFAULT_CUTOFF_HOUR || (hour === DEFAULT_CUTOFF_HOUR && minute < DEFAULT_CUTOFF_MINUTE)
  const utcDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)))

  if (isBeforeCutoff) utcDate.setUTCDate(utcDate.getUTCDate() - 1)

  return `${utcDate.getUTCFullYear()}-${pad2(utcDate.getUTCMonth() + 1)}-${pad2(utcDate.getUTCDate())}`
}

const getNextTaipeiCutoffTimestamp = (date = new Date()) => {
  const parts = getTaipeiParts(date)
  const hour = Number(parts.hour || 0)
  const minute = Number(parts.minute || 0)
  const second = Number(parts.second || 0)
  const shouldUseToday =
    hour < DEFAULT_CUTOFF_HOUR ||
    (hour === DEFAULT_CUTOFF_HOUR && minute < DEFAULT_CUTOFF_MINUTE) ||
    (hour === DEFAULT_CUTOFF_HOUR && minute === DEFAULT_CUTOFF_MINUTE && second === 0)
  const cutoffUtc = new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      DEFAULT_CUTOFF_HOUR - 8,
      DEFAULT_CUTOFF_MINUTE,
      0
    )
  )

  if (!shouldUseToday) cutoffUtc.setUTCDate(cutoffUtc.getUTCDate() + 1)

  return cutoffUtc.getTime()
}

export const createDashboardCacheKey = (scope, params = {}) => {
  const normalizedParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .sort(([left], [right]) => left.localeCompare(right))
  )

  return `${scope}:${JSON.stringify(normalizedParams)}`
}

export const useDashboardDataCacheStore = defineStore('dashboardDataCache', {
  persist:
    typeof window === 'undefined'
      ? false
      : {
          storage: window.sessionStorage
        },
  state: () => ({
    entries: {}
  }),
  actions: {
    getFresh(key) {
      const entry = this.entries[key]
      if (!entry) return null
      if (entry.version !== getTaipeiVersionDate() || Number(entry.expiresAt || 0) <= Date.now()) {
        delete this.entries[key]
        return null
      }
      return entry.payload
    },
    set(key, payload) {
      this.entries[key] = {
        payload,
        version: getTaipeiVersionDate(),
        cachedAt: Date.now(),
        expiresAt: getNextTaipeiCutoffTimestamp()
      }
      this.trimEntries()
      return payload
    },
    async remember(key, fetcher, { force = false } = {}) {
      if (!force) {
        const cached = this.getFresh(key)
        if (cached) return cached
      }

      const payload = await fetcher()
      return this.set(key, payload)
    },
    clearScope(scope) {
      Object.keys(this.entries).forEach((key) => {
        if (key.startsWith(`${scope}:`)) delete this.entries[key]
      })
    },
    clearExpired() {
      const version = getTaipeiVersionDate()
      const now = Date.now()
      Object.entries(this.entries).forEach(([key, entry]) => {
        if (entry.version !== version || Number(entry.expiresAt || 0) <= now)
          delete this.entries[key]
      })
    },
    trimEntries() {
      const entries = Object.entries(this.entries)
      if (entries.length <= MAX_CACHE_ENTRIES) return

      entries
        .sort(([, left], [, right]) => Number(left.cachedAt || 0) - Number(right.cachedAt || 0))
        .slice(0, entries.length - MAX_CACHE_ENTRIES)
        .forEach(([key]) => {
          delete this.entries[key]
        })
    }
  }
})
