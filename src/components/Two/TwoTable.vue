<script setup>
defineProps({
  data: {
    type: Array,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="two-table-wrapper" v-loading="loading">
    <el-table :data="data" style="width: 100%" class="two-el-table">
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        :label="col.label"
        :prop="col.prop"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :sortable="col.sortable"
      >
        <template v-if="col.slot" #default="scope">
          <slot :name="col.slot" :row="scope.row" :index="scope.$index"></slot>
        </template>
        <template v-else-if="col.formatter" #default="scope">
          {{ col.formatter(scope.row, scope.$index) }}
        </template>
      </el-table-column>

      <template #empty>
        <div class="empty-placeholder">
          <slot name="empty">目前沒有資料</slot>
        </div>
      </template>
    </el-table>
  </div>
</template>

<style lang="scss">
.two-table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid rgb(148 163 184 / 0.12);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(15 18 26 / 0.96), rgb(10 13 20 / 0.96));
  box-shadow:
    0 18px 48px rgb(0 0 0 / 0.18),
    inset 0 1px 0 rgb(255 255 255 / 0.03);

  .two-el-table {
    min-width: 760px;
    --el-table-border-color: rgb(148 163 184 / 0.12);
    --el-table-header-bg-color: transparent;
    --el-table-bg-color: transparent;
    --el-table-tr-bg-color: transparent;
    --el-table-text-color: #d7e1ed;
    --el-table-header-text-color: #94a3b8;
    --el-table-row-hover-bg-color: rgb(34 211 238 / 0.05);

    background-color: transparent;

    .el-table__inner-wrapper::before {
      display: none;
    }

    th.el-table__cell {
      border-bottom: 1px solid var(--el-table-border-color) !important;
      background-color: var(--el-table-header-bg-color) !important;
      padding: 14px 0;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    td.el-table__cell {
      border-bottom: 1px solid var(--el-table-border-color) !important;
      padding: 14px 0;
      font-size: 13px;
    }

    .el-table__border-left-patch {
      background-color: var(--el-table-border-color);
    }

    .cell {
      padding: 0 14px;
      white-space: nowrap;
    }

    .el-table__cell:last-child {
      border-right: none;
    }
  }

  .empty-placeholder {
    padding: 52px 16px;
    color: #8a97a8;
    text-align: center;
    font-size: 13px;
  }
}

.two-el-table .el-scrollbar__bar {
  z-index: 5;
}

@media (max-width: 760px) {
  .two-table-wrapper {
    border-radius: 16px;
  }

  .two-table-wrapper .two-el-table {
    min-width: 680px;
  }
}
</style>
