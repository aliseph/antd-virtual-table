<template>
  <a-list itemLayout="horizontal" rowKey="dataIndex" :dataSource="columns">
    <a-list-item slot="renderItem" slot-scope="item, index">
      <a-list-item-meta :title="item.title"></a-list-item-meta>
      <a-select
        slot="actions"
        :value="item.symbol"
        @change="$emit('changeItem', index, 'symbol', $event)"
        style="width:120px;"
      >
        <a-select-option
          v-for="option in getSymbolList(item)"
          :value="option.key"
          :key="option.key"
        >
          {{ option.label }}
        </a-select-option>
      </a-select>
      <a-input
        slot="actions"
        style="width:120px;"
        :value="item.condition"
        @change="$emit('changeItem', index, 'condition', $event.target.value)"
      ></a-input>
      <a-icon
        type="minus"
        style="margin-right: 8px;color:#f5222d;"
        slot="actions"
        @click="$emit('removeItem', index)"
      />
    </a-list-item>
  </a-list>
</template>
<script>
const stringSymbolList = [
  { key: 'like', label: 'like' },
  { key: 'eq', label: '=' },
  { key: 'ne', label: '!=' },
  { key: 'isNull', label: '为空' },
  { key: 'isNotNull', label: '不为空' }
]

const numberSymbolList = [
  { key: 'gt', label: '>' },
  { key: 'ge', label: '>=' },
  { key: 'lt', label: '<' },
  { key: 'le', label: '<=' },
  { key: 'eq', label: '=' },
  { key: 'ne', label: '!=' },
  { key: 'eqzero', label: '等于零' },
  { key: 'nezero', label: '不等于零' },
  { key: 'gtzero', label: '大于零' },
  { key: 'ltzero', label: '小于零' }
]
export default {
  name: 'FilterList',
  props: {
    columns: {
      type: Array
    }
  },
  data() {
    return {
      stringSymbolList,
      numberSymbolList
    }
  },
  methods: {
    getSymbolList(column) {
      if (column.type && ['currency', 'number'].includes(column.type)) {
        return this.numberSymbolList
      } else {
        return this.stringSymbolList
      }
    }
  }
}
</script>
