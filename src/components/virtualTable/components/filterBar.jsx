import filterList from './filterList'

export default {
  name: 'TableFilter',
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
      currentColumns: this.columns
    }
  },
  watch: {
    columns(value) {
      this.currentColumns = this.columns
    }
  },
  mounted() {
    this.currentColumns = this.columns
  },
  render() {
    const filterClass = {
      'hd-table-filter-content': true,
      'hd-table-filter-content-open': this.value
    }
    const onFilterBarVisibleChange = visible => {
      this.$emit('input', visible)
    }

    const onChangeItem = (index, key, value) => {
      this.$set(this.currentColumns, index, {
        ...this.currentColumns[index],
        [key]: value
      })
    }

    const onRemoveItem = index => {
      this.currentColumns.splice(index, 1)
    }

    const onFilter = () => {
      this.$emit('filter', this.currentColumns)
    }

    const onClear = () => {
      this.$emit('filter', [])
      this.$emit('input', false)
    }

    return (
      <a-dropdown
        placement="topRight"
        trigger={['click']}
        onVisibleChange={onFilterBarVisibleChange}
        visible={this.value}
      >
        <div class="hd-table-filter">
          <div class={filterClass}>
            <a-badge count={this.currentColumns.length}>
              <a-icon type="filter" />
            </a-badge>
          </div>
        </div>
        <div slot="overlay">
          <a-card bodyStyle={{ width: '500px' }}>
            <div slot="title">
              <a-icon type="filter" /> 筛选
            </div>
            <filterList columns={this.currentColumns} onChangeItem={onChangeItem} onRemoveItem={onRemoveItem} />
            <template class="ant-card-actions" slot="actions">
              <a-icon type="close" onClick={onClear} title="清空" />
              <a-icon type="check" onClick={onFilter} title="确定" />
            </template>
          </a-card>
        </div>
      </a-dropdown>
    )
  }
}
