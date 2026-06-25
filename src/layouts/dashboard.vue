<script setup>
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/dashboard-console.scss'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCookies } from '@vueuse/integrations/useCookies'
import {
  Bell,
  ChevronRight,
  Coins,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X
} from 'lucide-vue-next'
import { postUserLogout } from '@/firebase/user.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { useStockStore } from '@/stores/useStock.js'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
import { navGroups as rawNavGroups } from '@/router/SidebarData.js'

const route = useRoute()
const router = useRouter()
const cookies = useCookies(['token'])
const userInfoStore = useUserInfoStore()
const stockStore = useStockStore()
const dashboardSettingStore = useDashboardSettingStore()

const sidebarOpen = ref(false)
const systemPrefersDark = ref(true)
let themeMediaQuery = null
let removeSystemThemeListener = null
const userInfo = computed(() => userInfoStore.userInfo)
const currentRouteName = computed(() => route.name)
const shareUnitIsLot = computed({
  get: () => dashboardSettingStore.shareUnit === 'lot',
  set: (enabled) => dashboardSettingStore.setShareUnit(enabled ? 'lot' : 'share')
})
const themeOptions = [
  { value: 'dark', label: '深色', description: '霓虹深色', icon: Moon },
  { value: 'light', label: '淺色', description: '清爽閱讀', icon: Sun },
  { value: 'system', label: '系統', description: '跟隨裝置', icon: Monitor }
]
const dashboardTheme = computed(() => dashboardSettingStore.themeMode || 'dark')
const resolvedTheme = computed(() => {
  if (dashboardTheme.value === 'system') return systemPrefersDark.value ? 'dark' : 'light'
  return dashboardTheme.value === 'light' ? 'light' : 'dark'
})
const dashboardThemeClass = computed(() => `theme-${resolvedTheme.value}`)
const themeLabel = computed(
  () => themeOptions.find((option) => option.value === dashboardTheme.value)?.label || '深色'
)

const resolvePath = (routeName) => {
  if (!routeName) return '/'
  return (
    '/' +
    routeName
      .split('_')
      .map((part) => part.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
      .join('/')
  )
}

const navGroups = computed(() =>
  rawNavGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      to: item.to || resolvePath(item.path)
    }))
  }))
)

const navItems = computed(() => navGroups.value.flatMap((group) => group.items))
const currentNavItem = computed(() => navItems.value.find((item) => isNavActive(item)))
const currentNavGroup = computed(() =>
  navGroups.value.find((group) => group.items.some((item) => isNavActive(item)))
)

const isNavActive = (item) => {
  if (currentRouteName.value === item.path) return true
  const targetPath = item.to
  return Boolean(
    targetPath && (route.path === targetPath || route.path.startsWith(targetPath + '/'))
  )
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const setDashboardTheme = (mode) => {
  dashboardSettingStore.setThemeMode(mode)
}

const handleLogout = async () => {
  cookies.remove('token')
  userInfoStore.clear()
  stockStore.clear()

  try {
    await postUserLogout()
  } catch (error) {
    // ignore sign-out failures and continue to login
  } finally {
    router.push({ name: 'LogoutPage', query: { target: 'dashboard' } })
  }
}

watch(
  () => route.fullPath,
  () => closeSidebar(),
  { immediate: true }
)

watch(
  resolvedTheme,
  (theme) => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
  { immediate: true }
)

onMounted(() => {
  themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = themeMediaQuery.matches

  const handleSystemThemeChange = (event) => {
    systemPrefersDark.value = event.matches
  }

  themeMediaQuery.addEventListener('change', handleSystemThemeChange)
  removeSystemThemeListener = () => {
    themeMediaQuery?.removeEventListener('change', handleSystemThemeChange)
  }
})

onUnmounted(() => {
  removeSystemThemeListener?.()
  document.documentElement.classList.remove('dark')
})
</script>

<template>
  <div class="dashboard-shell" :class="dashboardThemeClass">
    <aside class="dashboard-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="brand-section">
        <div class="brand-mark">
          <Coins :size="24" />
        </div>
        <div class="brand-copy">
          <div class="brand-title">Stock Dividends</div>
          <div class="brand-subtitle">Neon market intelligence</div>
        </div>
      </div>

      <nav class="nav-list">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <div class="nav-label">{{ group.label }}</div>
          <router-link
            v-for="item in group.items"
            :key="item.path"
            :to="item.to || { name: item.path }"
            class="nav-item"
            :class="{ active: isNavActive(item) }"
          >
            <component :is="item.icon" :size="17" />
            <span>{{ item.title }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <div class="avatar">
            <img v-if="userInfo.photoURL" :src="userInfo.photoURL" alt="Avatar" />
            <User v-else :size="20" />
          </div>
          <div class="user-text">
            <span>{{ userInfo.displayName || '未命名使用者' }}</span>
            <small>{{ userInfo.email || '尚未登入帳號' }}</small>
          </div>
        </div>

        <button class="logout-button" type="button" @click="handleLogout">
          <LogOut :size="18" />
          <span>登出</span>
        </button>
      </div>

      <button v-if="sidebarOpen" class="sidebar-close" type="button" @click="closeSidebar">
        <X :size="18" />
      </button>
    </aside>

    <div v-if="sidebarOpen" class="dashboard-overlay" @click="closeSidebar"></div>

    <section class="dashboard-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-button" type="button" @click="sidebarOpen = true">
            <Menu :size="20" />
          </button>
          <div class="breadcrumb">
            <span>Dashboard</span>
            <ChevronRight v-if="currentNavGroup" :size="14" />
            <span v-if="currentNavGroup">{{ currentNavGroup.label }}</span>
            <ChevronRight :size="14" />
            <strong>{{ currentNavItem?.title || '概覽' }}</strong>
          </div>
        </div>

        <div class="topbar-actions">
          <!-- <label class="dashboard-search">
            <Search :size="16" />
            <input type="search" placeholder="搜尋頁面或股票代號" />
          </label> -->
          <el-dropdown trigger="click" popper-class="dashboard-settings-popper" :teleported="false">
            <button class="topbar-icon-button" type="button">
              <Settings :size="16" />
            </button>
            <template #dropdown>
              <div class="settings-menu">
                <div class="settings-section">
                  <div class="settings-section-heading">
                    <strong>外觀模式</strong>
                    <span>{{ themeLabel }}</span>
                  </div>

                  <div class="theme-options" role="group" aria-label="Dashboard 外觀模式">
                    <button
                      v-for="item in themeOptions"
                      :key="item.value"
                      class="theme-option"
                      :class="{ active: dashboardTheme === item.value }"
                      type="button"
                      :aria-pressed="dashboardTheme === item.value"
                      @click="setDashboardTheme(item.value)"
                    >
                      <component :is="item.icon" :size="16" />
                      <span>
                        <strong>{{ item.label }}</strong>
                        <small>{{ item.description }}</small>
                      </span>
                    </button>
                  </div>
                </div>

                <div class="settings-row">
                  <div>
                    <strong>檢視角度</strong>
                    <span>{{ shareUnitIsLot ? '張' : '股' }}</span>
                  </div>
                  <el-switch
                    v-model="shareUnitIsLot"
                    inline-prompt
                    active-text="張"
                    inactive-text="股"
                  />
                </div>
              </div>
            </template>
          </el-dropdown>
          <!-- <button class="topbar-icon-button" type="button">
            <Bell :size="16" />
          </button>
          <div class="topbar-avatar">
            <img v-if="userInfo.photoURL" :src="userInfo.photoURL" alt="Avatar" />
            <User v-else :size="17" />
          </div> -->
        </div>
      </header>

      <main class="main-panel">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </section>
  </div>
</template>

<style scoped lang="scss">
.dashboard-shell {
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  color: #e5eef7;
  background: var(--dashboard-shell-bg);
}

.dashboard-shell::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: var(--dashboard-shell-overlay);
  opacity: 0.8;
}

.dashboard-shell {
  --stock-rise-color: #d75455;
  --stock-fall-color: #24936e;
  --stock-neutral-color: #7c8794;
  --dashboard-shell-bg: radial-gradient(circle at top left, rgb(34 211 238 / 0.12), transparent 32%),
    radial-gradient(circle at 85% 20%, rgb(244 114 182 / 0.08), transparent 24%),
    linear-gradient(180deg, #05070b 0%, #090c13 100%);
  --dashboard-shell-overlay: radial-gradient(
      circle at 20% 20%,
      rgb(34 211 238 / 0.05),
      transparent 24%
    ),
    radial-gradient(circle at 80% 0%, rgb(255 255 255 / 0.04), transparent 18%);
  --dashboard-text-primary: #f8fbff;
  --dashboard-text-secondary: #cbd5e1;
  --dashboard-text-muted: #7c8794;
  --dashboard-sidebar-bg: linear-gradient(180deg, rgb(15 18 26 / 0.92), rgb(8 10 16 / 0.96));
  --dashboard-topbar-bg: linear-gradient(180deg, rgb(8 10 16 / 0.85), rgb(8 10 16 / 0.72));
  --dashboard-glass-bg: rgb(255 255 255 / 0.03);
  --dashboard-control-bg: rgb(255 255 255 / 0.04);
  --dashboard-control-border: rgb(148 163 184 / 0.14);
  --dashboard-panel-bg: linear-gradient(180deg, rgb(15 18 26 / 0.72), rgb(10 13 20 / 0.72));
  --dashboard-panel-shadow: 0 24px 80px rgb(0 0 0 / 0.25);
  --dashboard-section-bg: radial-gradient(circle at 0% 0%, rgb(34 211 238 / 0.075), transparent 34%),
    linear-gradient(135deg, rgb(255 255 255 / 0.058), rgb(255 255 255 / 0.018)), rgb(8 11 16 / 0.58);
  --dashboard-section-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07), 0 22px 70px rgb(0 0 0 / 0.18);
  --dashboard-danger-glow: rgb(244 114 182 / 0.28);
  --main-bg-color: #05070b;
  --main-bg-sub-color: #0f1218;
  --main-bg-light-color: #141a24;
  --main-surface-color: #0f1320;
  --main-surface-elevated-color: #161b28;
  --main-border-color: rgb(148 163 184 / 0.16);
  --main-glow-color: rgb(34 211 238 / 0.22);
}

.dashboard-shell.theme-light {
  --stock-rise-color: #c83f45;
  --stock-fall-color: #16805c;
  --stock-neutral-color: #718096;
  --dashboard-shell-bg: radial-gradient(circle at 6% 0%, rgb(14 165 233 / 0.14), transparent 30%),
    radial-gradient(circle at 92% 14%, rgb(16 185 129 / 0.11), transparent 28%),
    linear-gradient(180deg, #f7fafc 0%, #eef4f8 100%);
  --dashboard-shell-overlay: radial-gradient(
      circle at 18% 14%,
      rgb(255 255 255 / 0.72),
      transparent 26%
    ),
    radial-gradient(circle at 78% 0%, rgb(14 165 233 / 0.08), transparent 20%);
  --dashboard-text-primary: #102033;
  --dashboard-text-secondary: #334155;
  --dashboard-text-muted: #64748b;
  --dashboard-sidebar-bg: linear-gradient(180deg, rgb(255 255 255 / 0.78), rgb(241 247 250 / 0.88));
  --dashboard-topbar-bg: linear-gradient(180deg, rgb(255 255 255 / 0.78), rgb(245 250 252 / 0.62));
  --dashboard-glass-bg: rgb(255 255 255 / 0.62);
  --dashboard-control-bg: rgb(255 255 255 / 0.72);
  --dashboard-control-border: rgb(71 85 105 / 0.14);
  --dashboard-panel-bg: linear-gradient(180deg, rgb(255 255 255 / 0.66), rgb(247 251 253 / 0.56));
  --dashboard-panel-shadow: 0 24px 80px rgb(15 23 42 / 0.12);
  --dashboard-section-bg: radial-gradient(circle at 0% 0%, rgb(14 165 233 / 0.1), transparent 34%),
    linear-gradient(135deg, rgb(255 255 255 / 0.78), rgb(255 255 255 / 0.48)),
    rgb(248 252 254 / 0.72);
  --dashboard-section-shadow: inset 0 1px 0 rgb(255 255 255 / 0.82), 0 22px 70px rgb(15 23 42 / 0.1);
  --dashboard-danger-glow: rgb(220 38 38 / 0.2);
  --main-bg-color: #f7fafc;
  --main-bg-sub-color: #eef4f8;
  --main-bg-light-color: #e6eef4;
  --main-surface-color: #ffffff;
  --main-surface-elevated-color: #f8fbfd;
  --main-border-color: rgb(71 85 105 / 0.14);
  --main-glow-color: rgb(14 165 233 / 0.16);
  color: var(--dashboard-text-primary);
}

.dashboard-shell,
.dashboard-shell * {
  box-sizing: border-box;
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  height: 100dvh;
  flex-direction: column;
  border-right: 1px solid var(--dashboard-control-border);
  background: var(--dashboard-sidebar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 26px 18px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 26px;
}

.brand-mark {
  display: flex;
  height: 42px;
  width: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  color: #061016;
  background: linear-gradient(135deg, rgb(34 211 238), rgb(16 185 129));
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.12) inset,
    0 14px 40px rgb(34 211 238 / 0.18);
}

.brand-copy {
  display: grid;
  gap: 2px;
}

.brand-title {
  color: var(--dashboard-text-primary);
  font-size: 18px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.brand-subtitle {
  color: var(--dashboard-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 26px;
  margin-top: 18px;
  overflow: auto;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-label {
  padding: 0 10px 4px;
  color: var(--dashboard-text-muted);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 0 12px;
  color: var(--dashboard-text-secondary);
  font-size: 14px;
  font-weight: 800;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  color: var(--dashboard-text-primary);
  border-color: rgb(34 211 238 / 0.18);
  background: linear-gradient(135deg, rgb(34 211 238 / 0.12), rgb(8 145 178 / 0.08));
  box-shadow: 0 14px 32px rgb(0 0 0 / 0.14);
}

.nav-item.active {
  color: var(--dashboard-text-primary);
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--dashboard-control-border);
  padding-top: 18px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  min-width: 0;
}

.avatar,
.topbar-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  background: var(--dashboard-glass-bg);
  color: var(--dashboard-text-secondary);
}

.avatar {
  width: 40px;
  height: 40px;
  border: 1px solid var(--dashboard-control-border);
}

.avatar img,
.topbar-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-text {
  display: grid;
  min-width: 0;
}

.user-text span,
.user-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-text span {
  color: var(--dashboard-text-primary);
  font-size: 13px;
  font-weight: 800;
}

.user-text small {
  color: var(--dashboard-text-muted);
  font-size: 11px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 14px;
  padding: 11px 12px;
  color: var(--dashboard-text-muted);
  background: var(--dashboard-glass-bg);
}

.logout-button:hover {
  border-color: var(--dashboard-danger-glow);
  color: var(--dashboard-text-primary);
  background: linear-gradient(135deg, rgb(244 114 182 / 0.12), rgb(239 68 68 / 0.08));
}

.sidebar-close {
  position: absolute;
  top: 22px;
  right: -44px;
  display: none;
  height: 34px;
  width: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--dashboard-control-border);
  color: var(--dashboard-text-primary);
  background: var(--dashboard-sidebar-bg);
}

.dashboard-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: none;
  background: rgb(4 6 10 / 0.56);
  backdrop-filter: blur(4px);
}

.dashboard-content {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  min-height: 80px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid var(--dashboard-control-border);
  background: var(--dashboard-topbar-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  padding: 16px 28px;
}

.topbar-left,
.topbar-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.topbar-left {
  flex: 1 1 auto;
}

.topbar-actions {
  flex: 0 0 auto;
}

.breadcrumb {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: var(--dashboard-text-muted);
  font-size: 13px;
  font-weight: 800;
}

.breadcrumb span,
.breadcrumb strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb strong {
  color: var(--dashboard-text-primary);
}

.mobile-menu-button,
.topbar-icon-button {
  display: inline-flex;
  height: 38px;
  width: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 12px;
  background: var(--dashboard-glass-bg);
  color: var(--dashboard-text-secondary);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.mobile-menu-button:hover,
.topbar-icon-button:hover {
  border-color: rgb(34 211 238 / 0.34);
  background: rgb(34 211 238 / 0.1);
}

.mobile-menu-button:active,
.topbar-icon-button:active {
  transform: translateY(1px);
}

.mobile-menu-button {
  display: none;
}

.dashboard-search {
  display: flex;
  height: 40px;
  width: min(320px, 32vw);
  align-items: center;
  gap: 9px;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 12px;
  background: var(--dashboard-glass-bg);
  padding: 0 12px;
  color: #6f7680;
}

.dashboard-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--dashboard-text-primary);
  font-size: 13px;
}

.topbar-avatar {
  width: 38px;
  height: 38px;
}

.settings-menu {
  min-width: 260px;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 16px;
  background: var(--dashboard-panel-bg);
  box-shadow: var(--dashboard-panel-shadow);
  padding: 14px;
  color: var(--dashboard-text-secondary);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
}

.settings-section {
  display: grid;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--dashboard-control-border);
}

.settings-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-section-heading strong {
  color: var(--dashboard-text-primary);
  font-size: 13px;
}

.settings-section-heading span {
  color: var(--dashboard-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.theme-option {
  display: grid;
  min-width: 0;
  gap: 7px;
  justify-items: center;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 12px;
  background: var(--dashboard-glass-bg);
  padding: 10px 8px;
  color: var(--dashboard-text-muted);
  text-align: center;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.theme-option:hover,
.theme-option.active {
  border-color: rgb(34 211 238 / 0.42);
  background: rgb(34 211 238 / 0.1);
  color: var(--dashboard-text-primary);
}

.theme-option:active {
  transform: translateY(1px);
}

.theme-option span {
  display: grid;
  gap: 2px;
}

.theme-option strong {
  color: inherit;
  font-size: 12px;
}

.theme-option small {
  color: var(--dashboard-text-muted);
  font-size: 10px;
  font-weight: 800;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
}

.settings-row div {
  display: grid;
  gap: 3px;
}

.settings-row strong {
  color: var(--dashboard-text-primary);
  font-size: 13px;
}

.settings-row span {
  color: var(--dashboard-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.main-panel {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 24px;
}

.main-panel-shell {
  width: 100%;
  min-height: calc(100dvh - 128px);
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--dashboard-control-border);
  border-radius: 28px;
  background: var(--dashboard-panel-bg);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    var(--dashboard-panel-shadow),
    inset 0 1px 0 rgb(255 255 255 / 0.04);
  padding: 24px;
}

.main-panel-shell :deep(> *) {
  max-width: 100%;
  min-width: 0;
}

.main-panel-shell :deep(.console-bar),
.main-panel-shell :deep(.console-panel),
.main-panel-shell :deep(.detail-header),
.main-panel-shell :deep(.terminal-panel),
.main-panel-shell :deep(.terminal-titlebar),
.main-panel-shell :deep(.metric-strip),
.main-panel-shell :deep(.chart-shell),
.main-panel-shell :deep(.two-table-wrapper) {
  max-width: 100%;
  min-width: 0;
}

@media (max-width: 1023px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 272px;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dashboard-sidebar.is-open {
    transform: translateX(0);
  }

  .dashboard-sidebar.is-open .sidebar-close,
  .dashboard-overlay,
  .mobile-menu-button {
    display: inline-flex;
  }

  .main-panel {
    padding: 18px;
  }

  .main-panel-shell {
    border-radius: 22px;
    padding: 18px;
  }

  .topbar {
    padding: 12px 20px;
  }
}

@media (max-width: 720px) {
  .dashboard-search {
    display: none;
  }

  .topbar {
    min-height: 68px;
  }

  .breadcrumb span:not(:last-child),
  .breadcrumb svg {
    display: none;
  }
}

@media (max-width: 560px) {
  .topbar {
    gap: 10px;
    padding: 10px 12px;
  }

  .topbar-actions {
    gap: 8px;
  }

  .main-panel {
    padding: 10px;
  }

  .main-panel-shell {
    border-radius: 18px;
    padding: 12px;
  }
}

.dashboard-shell {
  .text-slate-900,
  .text-slate-800 {
    color: #e2e8f0 !important;
  }

  .text-slate-600,
  .text-slate-700 {
    color: #cbd5e1 !important;
  }

  .text-slate-500,
  .text-slate-400 {
    color: #7c8794 !important;
  }

  .bg-white,
  .bg-slate-50,
  .bg-slate-50\/50 {
    background-color: rgb(255 255 255 / 0.02) !important;
  }

  .bg-slate-100 {
    background-color: rgb(255 255 255 / 0.06) !important;
  }

  .border-slate-200,
  .border-slate-100 {
    border-color: rgb(148 163 184 / 0.14) !important;
  }

  .rounded-2xl,
  .rounded-xl {
    border-radius: 18px !important;
  }

  .shadow-sm,
  .shadow-md {
    box-shadow: none !important;
  }

  input,
  select {
    background-color: var(--dashboard-control-bg) !important;
    border-color: var(--dashboard-control-border) !important;
    color: var(--dashboard-text-primary) !important;
    color-scheme: dark;
  }

  select option {
    background-color: var(--main-surface-color);
    color: var(--dashboard-text-primary);
  }

  .el-input__wrapper {
    background-color: rgb(255 255 255 / 0.04) !important;
    box-shadow: 0 0 0 1px rgb(148 163 184 / 0.14) inset !important;

    &:hover {
      box-shadow: 0 0 0 1px rgb(34 211 238 / 0.34) inset !important;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
    }
  }

  .el-input__inner {
    color: #d4d8dd !important;

    &::placeholder {
      color: #64748b !important;
    }
  }

  input::placeholder {
    color: #64748b !important;
  }

  table {
    color: #cbd5e1;
  }

  thead tr,
  th {
    background: rgb(255 255 255 / 0.03) !important;
    color: #aab4c0 !important;
    border-color: rgb(148 163 184 / 0.12) !important;
  }

  td,
  tr {
    border-color: rgb(148 163 184 / 0.12) !important;
  }

  tr:hover {
    background: rgb(34 211 238 / 0.05) !important;
  }
}

.dashboard-shell.theme-light {
  .text-slate-900,
  .text-slate-800 {
    color: #102033 !important;
  }

  .text-slate-600,
  .text-slate-700 {
    color: #334155 !important;
  }

  .text-slate-500,
  .text-slate-400 {
    color: #64748b !important;
  }

  .bg-white,
  .bg-slate-50,
  .bg-slate-50\/50 {
    background-color: rgb(255 255 255 / 0.66) !important;
  }

  .bg-slate-100 {
    background-color: rgb(226 232 240 / 0.62) !important;
  }

  .border-slate-200,
  .border-slate-100 {
    border-color: rgb(71 85 105 / 0.14) !important;
  }

  input,
  select {
    background-color: var(--dashboard-control-bg) !important;
    border-color: var(--dashboard-control-border) !important;
    color: var(--dashboard-text-primary) !important;
    color-scheme: light;
  }

  select option {
    background-color: var(--main-surface-color);
    color: var(--dashboard-text-primary);
  }

  .el-input__wrapper {
    background-color: rgb(255 255 255 / 0.72) !important;
    box-shadow: 0 0 0 1px rgb(71 85 105 / 0.14) inset !important;

    &:hover {
      box-shadow: 0 0 0 1px rgb(14 165 233 / 0.36) inset !important;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
    }
  }

  .el-input__inner {
    color: #102033 !important;

    &::placeholder {
      color: #94a3b8 !important;
    }
  }

  input::placeholder {
    color: #94a3b8 !important;
  }

  table {
    color: #334155;
  }

  thead tr,
  th {
    background: rgb(255 255 255 / 0.58) !important;
    color: #475569 !important;
    border-color: rgb(71 85 105 / 0.14) !important;
  }

  td,
  tr {
    color: #334155;
    border-color: rgb(71 85 105 / 0.12) !important;
  }

  tr:hover {
    background: rgb(14 165 233 / 0.06) !important;
  }

  :deep(.console-panel),
  :deep(.terminal-panel),
  :deep(.terminal-titlebar),
  :deep(.ticker-card),
  :deep(.trade-context),
  :deep(.return-card),
  :deep(.metric-box),
  :deep(.chart-shell),
  :deep(.overview-card),
  :deep(.overview-card-skeleton) {
    border-color: rgb(71 85 105 / 0.14) !important;
    background: radial-gradient(circle at 0% 0%, rgb(14 165 233 / 0.1), transparent 34%),
      linear-gradient(135deg, rgb(255 255 255 / 0.78), rgb(255 255 255 / 0.48)),
      rgb(248 252 254 / 0.72) !important;
    color: #334155 !important;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.82),
      0 22px 70px rgb(15 23 42 / 0.1) !important;
  }

  :deep(.detail-header) {
    border-color: rgb(71 85 105 / 0.14) !important;
    background: radial-gradient(circle at 11% 0%, rgb(14 165 233 / 0.15), transparent 34%),
      radial-gradient(circle at 86% 20%, rgb(16 185 129 / 0.11), transparent 30%),
      linear-gradient(135deg, rgb(255 255 255 / 0.82), rgb(246 250 252 / 0.68)) !important;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.8),
      0 18px 60px rgb(15 23 42 / 0.11) !important;
  }

  :deep(.overview-card h2),
  :deep(.stock-identity strong),
  :deep(.holding-ratio),
  :deep(.card-empty strong),
  :deep(.panel-heading h2),
  :deep(.metric-box strong),
  :deep(.stock-identity h1),
  :deep(.stock-identity h1 strong),
  :deep(h1),
  :deep(h2) {
    color: #102033 !important;
  }

  :deep(.card-summary),
  :deep(.stock-identity span),
  :deep(.card-empty),
  :deep(.card-empty span),
  :deep(.panel-heading span),
  :deep(.metric-box span),
  :deep(.breadcrumb),
  :deep(.trend-caption),
  :deep(.event-change) {
    color: #64748b !important;
  }

  :deep(.holding-row),
  :deep(.event-row) {
    border-color: rgb(71 85 105 / 0.12) !important;
  }

  :deep(.holding-row:hover),
  :deep(.event-row:hover) {
    background: rgb(14 165 233 / 0.05) !important;
  }

  :deep(.detail-link),
  :deep(.refresh-button),
  :deep(.stock-link-button) {
    border-color: rgb(71 85 105 / 0.14) !important;
    background: rgb(255 255 255 / 0.66) !important;
    color: #334155 !important;
  }

  :deep(.detail-link:hover),
  :deep(.refresh-button:hover),
  :deep(.stock-link-button:hover) {
    border-color: rgb(14 165 233 / 0.38) !important;
    color: #0284c7 !important;
  }
}

.dashboard-shell :global(.value-up),
.dashboard-shell :global(.stock-rise) {
  color: var(--stock-rise-color) !important;
}

.dashboard-shell :global(.value-down),
.dashboard-shell :global(.stock-fall) {
  color: var(--stock-fall-color) !important;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
