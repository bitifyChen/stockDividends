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
  overflow: hidden;
  border: 1px solid #2f3339;
  border-radius: 6px;
  background: #202328;

  .two-el-table {
    --el-table-border-color: #2f3339;
    --el-table-header-bg-color: #202328;
    --el-table-bg-color: #202328;
    --el-table-tr-bg-color: #202328;
    --el-table-text-color: #cbd5e1;
    --el-table-header-text-color: #aab4c0;
    --el-table-row-hover-bg-color: #2a2d33;

    background-color: transparent;

    .el-table__inner-wrapper::before {
      display: none;
    }

    th.el-table__cell {
      border-bottom: 1px solid var(--el-table-border-color) !important;
      background-color: var(--el-table-header-bg-color) !important;
      padding: 10px 0;
      font-size: 12px;
      font-weight: 900;
    }

    td.el-table__cell {
      border-bottom: 1px solid var(--el-table-border-color) !important;
      padding: 10px 0;
      font-size: 13px;
    }

    .el-table__border-left-patch {
      background-color: var(--el-table-border-color);
    }

    .cell {
      padding: 0 12px;
      white-space: nowrap;
    }

    .el-table__cell:last-child {
      border-right: none;
    }
  }

  .empty-placeholder {
    padding: 42px 16px;
    color: #7c858f;
    text-align: center;
    font-size: 13px;
  }
}

.two-el-table .el-scrollbar__bar {
  z-index: 5;
}
</style>
