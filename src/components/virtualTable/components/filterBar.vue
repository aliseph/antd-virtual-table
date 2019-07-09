<template>
  <a-dropdown
    placement="topRight"
    :trigger="['click']"
    @visibleChange="onFilterBarVisibleChange"
    :visible="value"
  >
    <div class="hd-table-filter">
      <div :class="filterClass">
        <a-badge :count="columns.length">
          <a-icon type="filter" />
        </a-badge>
      </div>
    </div>
    <div slot="overlay">
      <a-card>
        <div slot="title">
          <a-icon type="filter" />筛选
        </div>
        <a-list itemLayout="horizontal" :data-source="columns">
          <a-list-item slot="renderItem" slot-scope="item">
            <a slot="actions">
              <a-input></a-input>
            </a>
            <a slot="actions">
              <a-icon type="close-circle" theme="twoTone" twoToneColor="#ff4d4f" />
            </a>
            <a slot="actions">
              <a-icon type="check-circle" theme="twoTone" twoToneColor="#40a9ff" />
            </a>
            {{item.title}}
          </a-list-item>
        </a-list>
        <template class="ant-card-actions" slot="actions">
          <span style="color:#ff4d4f" @click="onClear">
            <a-icon type="close" />&nbsp;清除
          </span>
          <span style="color:#40a9ff" @click="onOk">
            <a-icon type="check" />&nbsp;确认
          </span>
        </template>
      </a-card>
    </div>
  </a-dropdown>
</template>
<script>
export default {
  name: 'tableFilter',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
    }
  },
  computed: {
    filterClass() {
      return {
        'hd-table-filter-content': true,
        'hd-table-filter-content-open': this.value
      }
    }
  },
  methods: {
    onFilterBarVisibleChange(visible) {
      this.$emit('input', visible)
    },
    onClear() {
      this.$emit('clear')
    },
    onOk() {
      this.$emit('ok')
    }
  }
}
</script>
