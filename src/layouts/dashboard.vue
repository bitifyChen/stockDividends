<script setup>
import 'element-plus/theme-chalk/dark/css-vars.css'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

onMounted(() => {
  document.documentElement.classList.add('dark')
})

onUnmounted(() => {
  document.documentElement.classList.remove('dark')
})
import { useRoute, useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores/useUserInfo.js'
import { useDashboardSettingStore } from '@/stores/useDashboardSetting.js'
import { navGroups as rawNavGroups } from '@/router/SidebarData.js'
import { Bell, ChevronRight, Coins, LogOut, Menu, Search, Settings, User, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userInfoStore = useUserInfoStore()
const dashboardSettingStore = useDashboardSettingStore()
const sidebarOpen = ref(false)

const userInfo = computed(() => userInfoStore.userInfo)
const currentRouteName = computed(() => route.name)
const shareUnitIsLot = computed({
  get: () => dashboardSettingStore.shareUnit === 'lot',
  set: (enabled) => dashboardSettingStore.setShareUnit(enabled ? 'lot' : 'share')
})

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
const currentNavGroup = computed(() => navGroups.value.find((group) => group.items.some((item) => isNavActive(item))))

const isNavActive = (item) => {
  if (currentRouteName.value === item.path) return true
  const targetPath = item.to
  return Boolean(targetPath && (route.path === targetPath || route.path.startsWith(targetPath + '/')))
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const handleLogout = () => {
  router.push({ name: 'logout' })
}

watch(
  () => route.fullPath,
  () => closeSidebar(),
  { immediate: true }
)
</script>

<template>
  <div class="dashboard-shell dark">
    <aside class="dashboard-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="brand-section">
        <div class="brand-mark">
          <Coins :size="24" />
        </div>
        <div>
          <div class="brand-title">股票小幫手</div>
          <div class="brand-subtitle">Stock Gauge Insights</div>
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
            <span>{{ userInfo.displayName || '使用者' }}</span>
            <small>{{ userInfo.email || '尚未登入' }}</small>
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
            <span>後台</span>
            <ChevronRight v-if="currentNavGroup" :size="14" />
            <span v-if="currentNavGroup">{{ currentNavGroup.label }}</span>
            <ChevronRight :size="14" />
            <strong>{{ currentNavItem?.title || '資料中心' }}</strong>
          </div>
        </div>

        <div class="topbar-actions">
          <label class="dashboard-search">
            <Search :size="16" />
            <input type="search" placeholder="Search..." />
          </label>
          <el-dropdown trigger="click" popper-class="dashboard-settings-popper">
            <button class="topbar-icon-button" type="button">
              <Settings :size="16" />
            </button>
            <template #dropdown>
              <div class="settings-menu">
                <div class="settings-row">
                  <div>
                    <strong>檢視角度</strong>
                
                  </div>
                  <el-switch
                    v-model="shareUnitIsLot"
                    inline-prompt
                    active-text="張數"
                    inactive-text="股數"
                  />
                </div>
              </div>
            </template>
          </el-dropdown>
          <button class="topbar-icon-button" type="button">
            <Bell :size="16" />
          </button>
          <div class="topbar-avatar">
            <img v-if="userInfo.photoURL" :src="userInfo.photoURL" alt="Avatar" />
            <User v-else :size="17" />
          </div>
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
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  background: #101113;
  color: #d4d8dd;
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  height: 100dvh;
  flex-direction: column;
  border-right: 1px solid #23262b;
  background: #151619;
  padding: 28px 18px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 28px;
}

.brand-mark {
  display: flex;
  height: 38px;
  width: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #25292f;
  color: #f7fafc;
  box-shadow: inset 0 0 0 1px #30343a;
}

.brand-title {
  color: #f7fafc;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
}

.brand-subtitle {
  margin-top: 2px;
  color: #7c858f;
  font-size: 11px;
  font-weight: 800;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-top: 18px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.nav-label {
  padding: 0 10px 4px;
  color: #6f7680;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  border-radius: 6px;
  padding: 0 10px;
  color: #aab0b8;
  font-size: 14px;
  font-weight: 800;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-item:hover,
.nav-item.active {
  background: #24272c;
  color: #fff;
}

.nav-item.active {
  background: #3a3d43;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid #2f3339;
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
  background: #30343a;
  color: #c8ced6;
}

.avatar {
  width: 40px;
  height: 40px;
  border: 1px solid #3c4149;
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
  color: #f7fafc;
  font-size: 13px;
  font-weight: 800;
}

.user-text small {
  color: #7c858f;
  font-size: 11px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border-radius: 6px;
  padding: 11px 12px;
  color: #9ca3af;
}

.logout-button:hover {
  background: #24272c;
  color: #fff;
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
  background: #151619;
  color: #fff;
}

.dashboard-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: none;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(4px);
}

.dashboard-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-bottom: 1px solid #2a2d33;
  background: #181a1e;
  padding: 16px 28px;
}

.topbar-left,
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7c8794;
  font-size: 13px;
  font-weight: 800;
}

.breadcrumb strong {
  color: #e2e8f0;
}

.mobile-menu-button,
.topbar-icon-button {
  display: inline-flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #202328;
  color: #c8ced6;
}

.mobile-menu-button {
  display: none;
}

.dashboard-search {
  display: flex;
  height: 38px;
  width: min(300px, 32vw);
  align-items: center;
  gap: 9px;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #111317;
  padding: 0 12px;
  color: #6f7680;
}

.dashboard-search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #d4d8dd;
  font-size: 13px;
}

.topbar-avatar {
  width: 36px;
  height: 36px;
}

.settings-menu {
  min-width: 220px;
  border: 1px solid #30343a;
  border-radius: 6px;
  background: #181a1e;
  padding: 12px;
  color: #d4d8dd;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings-row div {
  display: grid;
  gap: 3px;
}

.settings-row strong {
  color: #f7fafc;
  font-size: 13px;
}

.settings-row span {
  color: #7c858f;
  font-size: 12px;
  font-weight: 800;
}

.main-panel {
  min-width: 0;
  padding: 28px;
}

@media (max-width: 1023px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 252px;
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

  .topbar {
    padding: 12px 20px;
  }
}

@media (max-width: 720px) {
  .dashboard-search {
    display: none;
  }

  .topbar {
    min-height: 64px;
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
    background-color: #1b1d21 !important;
  }

  .bg-slate-100 {
    background-color: #2b2f35 !important;
  }

  .border-slate-200,
  .border-slate-100 {
    border-color: #2f3339 !important;
  }

  .rounded-2xl,
  .rounded-xl {
    border-radius: 6px !important;
  }

  .shadow-sm,
  .shadow-md {
    box-shadow: none !important;
  }

  input,
  select {
    background-color: #15191d !important;
    border-color: #30343a !important;
    color: #e2e8f0 !important;
  }

  .el-input__wrapper {
    background-color: #111317 !important;
    box-shadow: 0 0 0 1px #30343a inset !important;

    &:hover {
      box-shadow: 0 0 0 1px #40444a inset !important;
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
    background: #202328 !important;
    color: #aab4c0 !important;
    border-color: #2f3339 !important;
  }

  td,
  tr {
    border-color: #30373d !important;
  }

  tr:hover {
    background: #202328 !important;
  }
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
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
