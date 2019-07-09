export default {
  name: 'tableFooterCell',
  props: {
    column: {
      type: Object,
      default: () => {}
    },
    rows: {
      type: Array,
      default: () => []
    },
    checkedObservable: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showDropdown: false,
      actionAble: false,
      currentValue: null,
      currentKey: 'empty',
      subscription: null
    }
  },
  methods: {
    onClick({ key }) {
      this.currentKey = key
      let value = null
      switch (key) {
        case 'empty':
          value = null
          break
        case 'checkCount':
          value = this.rows.filter(row => row._checked).length
          break
        case 'unCheckCount':
          value = this.rows.filter(row => !row._checked).length
          break
        case 'checkPercent':
          value = Math.round((this.rows.filter(row => row._checked).length / this.rows.length) * 10000) / 100 + '%'
          break
        case 'unCheckPercent':
          value =
            Math.round(((this.rows.length - this.rows.filter(row => row._checked).length) / this.rows.length) * 10000) /
              100 +
            '%'
          break
        case 'summary':
          break
        case 'average':
          break
        case 'median':
          break
        case 'min':
          break
        case 'max':
          break
        case 'emptyCount':
          break
        case 'unEmptyCount':
          break
        case 'emptyPercent':
          break
        case 'unEmptyPercent':
          break
        case 'zeroCount':
          break
        case 'unZeroCount':
          break
        default:
          break
      }
      this.currentValue = value
      this.showDropdown = false
    }
  },
  mounted() {
    this.subscription = this.checkedObservable.subscribe(value => {
      if (!this.currentKey || this.currentKey == 'empty') return
      this.onClick({ key: this.currentKey })
    })
  },
  beforeDestroy() {
    this.subscription.unsubscribe()
  },
  render() {
    const column = this.column
    const props = {
      class: {
        'hd-table-cell': true
      },
      style: {
        width: column.width + 'px',
        'text-align': 'right'
      }
    }
    const actionProps = {
      class: {
        'hd-table-cell-action': true,
        'hd-table-cell-action-open': this.showDropdown
      },
      style: {
        color: this.actionAble ? '#ff7875' : '#69c0ff'
      }
    }

    const onVisibleChange = visible => {
      this.showDropdown = visible
    }
    return (
      <div {...props}>
        <span class="hd-table-cell-text">{this.currentValue}</span>
        <a-dropdown
          trigger={['click']}
          visible={this.showDropdown}
          onVisibleChange={onVisibleChange}
          placement="topRight"
        >
          <a-icon type="caret-up" {...actionProps} />
          <a-menu slot="overlay" onClick={this.onClick} selectedKeys={[this.currentKey]}>
            <a-menu-item key="empty">无</a-menu-item>
            <a-menu-item key="checkCount">选中条数</a-menu-item>
            <a-menu-item key="unCheckCount">未选中条数</a-menu-item>
            <a-menu-item key="checkPercent">选中百分比</a-menu-item>
            <a-menu-item key="unCheckPercent">未选中百分比</a-menu-item>
            {column.type && column.type === 'number' && <a-menu-item key="summary">合计</a-menu-item>}
            {column.type && column.type === 'number' && <a-menu-item key="average">平均值</a-menu-item>}
            {column.type && column.type === 'number' && <a-menu-item key="median">中位数</a-menu-item>}
            {column.type && column.type === 'number' && <a-menu-item key="min">最小值</a-menu-item>}
            {column.type && column.type === 'number' && <a-menu-item key="max">最大值</a-menu-item>}
            <a-menu-item key="emptyCount">为空条数</a-menu-item>
            <a-menu-item key="unEmptyCount">不为空条数</a-menu-item>
            <a-menu-item key="emptyPercent">为空百分比</a-menu-item>
            <a-menu-item key="unEmptyPercent">不为空百分比</a-menu-item>
            {column.type && column.type === 'number' && <a-menu-item key="zeroCount">为零条数</a-menu-item>}
            {column.type && column.type === 'number' && <a-menu-item key="unZeroCount">不为零条数</a-menu-item>}
          </a-menu>
        </a-dropdown>
      </div>
    )
  }
}
