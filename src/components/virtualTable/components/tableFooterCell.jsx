import _ from 'lodash'
export default {
  name: 'TableFooterCell',
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
    },
    summary: {
      type: Number
    }
  },
  data() {
    return {
      showDropdown: false,
      actionAble: false,
      currentValue: null,
      currentKey: 'empty',
      subscription: null,
      isAnyRowChecked: false
    }
  },
  computed: {
    showValue() {
      const currentValue = this.currentValue ? Math.round(this.currentValue * 100) / 100 : this.currentValue
      const summary = this.summary ? Math.round(this.summary * 100) / 100 : this.summary
      return currentValue || summary
    }
  },
  methods: {
    onClick({ key, isUpdated }) {
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
          if (this.isAnyRowChecked) {
            value =
              Math.round(
                this.rows.reduce(
                  (sum, row) => sum + (row._checked && !isNaN(this.getValue(row)) ? this.getValue(row) : 0),
                  0
                ) * 100
              ) / 100
          } else {
            value =
              Math.round(
                this.rows.reduce((sum, row) => sum + (!isNaN(this.getValue(row)) ? this.getValue(row) : 0), 0) * 100
              ) / 100
          }
          break
        case 'negativeSummary':
          if (this.isAnyRowChecked) {
            value =
              Math.round(
                this.rows.reduce(
                  (sum, row) =>
                    sum +
                    (row._checked && !isNaN(this.getValue(row)) && this.getValue(row) < 0 ? this.getValue(row) : 0),
                  0
                ) * 100
              ) / 100
          } else {
            value =
              Math.round(
                this.rows.reduce(
                  (sum, row) => sum + (!isNaN(this.getValue(row)) && this.getValue(row) < 0 ? this.getValue(row) : 0),
                  0
                ) * 100
              ) / 100
          }
          break
        case 'positiveSummary':
          if (this.isAnyRowChecked) {
            value =
              Math.round(
                this.rows.reduce(
                  (sum, row) =>
                    sum +
                    (row._checked && !isNaN(this.getValue(row)) && this.getValue(row) > 0 ? this.getValue(row) : 0),
                  0
                ) * 100
              ) / 100
          } else {
            value =
              Math.round(
                this.rows.reduce(
                  (sum, row) => sum + (!isNaN(this.getValue(row)) && this.getValue(row) > 0 ? this.getValue(row) : 0),
                  0
                ) * 100
              ) / 100
          }
          break
        case 'average':
          if (this.isAnyRowChecked) {
            value =
              Math.round(
                (this.rows.reduce(
                  (sum, row) => sum + (row._checked && !isNaN(this.getValue(row)) ? this.getValue(row) : 0),
                  0
                ) /
                  this.rows.filter(row => row._checked).length) *
                  100
              ) / 100
          } else {
            value =
              Math.round(
                (this.rows.reduce((sum, row) => sum + (!isNaN(this.getValue(row)) ? this.getValue(row) : 0), 0) /
                  this.rows.length) *
                  100
              ) / 100
          }
          break
        case 'median':
          break
        case 'min':
          if (this.isAnyRowChecked) {
            value = this.rows
              .filter(row => row._checked)
              .map(row => (isNaN(this.getValue(row)) ? 0 : this.getValue(row)))
          } else {
            value = _.min(this.rows.map(row => (isNaN(this.getValue(row)) ? 0 : this.getValue(row))))
          }
          break
        case 'max':
          if (this.isAnyRowChecked) {
            value = _.max(
              this.rows.filter(row => row._checked).map(row => (isNaN(this.getValue(row)) ? 0 : this.getValue(row)))
            )
          } else {
            value = _.max(this.rows.map(row => (isNaN(this.getValue(row)) ? 0 : this.getValue(row))))
          }
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
          if (this.isAnyRowChecked) {
            value = this.rows.filter(row => row._checked && !isNaN(this.getValue(row)) && this.getValue(row) == 0)
              .length
          } else {
            value = this.rows.filter(row => !isNaN(this.getValue(row)) && this.getValue(row) == 0).length
          }
          break
        case 'unZeroCount':
          if (this.isAnyRowChecked) {
            value = this.rows.filter(row => row._checked && !isNaN(this.getValue(row)) && this.getValue(row) != 0)
              .length
          } else {
            value = this.rows.filter(row => !isNaN(this.getValue(row)) && this.getValue(row) != 0).length
          }
          break
        default:
          break
      }
      this.currentValue = value
      if (!isUpdated) this.showDropdown = false
    },
    getValue(row) {
      // if (this.column.calculated) {
      //   return this.column.showFormula({ column: this.column, row })
      // } else {
      return row[this.column.dataIndex]
      // }
    }
  },
  created() {
    if (this.column.summary) {
      this.onClick({ key: 'summary' })
    }
    this.subscription = this.checkedObservable.subscribe(value => {
      this.isAnyRowChecked = this.rows.findIndex(row => row._checked) > -1
      if (!this.currentKey || this.currentKey == 'empty') return
      this.onClick({ key: this.currentKey })
    })
  },
  updated() {
    if (this.column.summary) {
      this.onClick({ key: this.currentKey, isUpdated: true })
    }
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
        <span class="hd-table-cell-text">{this.showValue}</span>
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
            {column.type && column.type === 'currency' && <a-menu-item key="summary">合计</a-menu-item>}
            {column.type && column.type === 'currency' && <a-menu-item key="positiveSummary">正值合计</a-menu-item>}
            {column.type && column.type === 'currency' && <a-menu-item key="negativeSummary">负值合计</a-menu-item>}
            {column.type && column.type === 'currency' && <a-menu-item key="average">平均值</a-menu-item>}
            {/* {column.type && column.type === 'currency' && (
              <a-menu-item key="median">中位数</a-menu-item>
            )} */}
            {column.type && column.type === 'currency' && <a-menu-item key="min">最小值</a-menu-item>}
            {column.type && column.type === 'currency' && <a-menu-item key="max">最大值</a-menu-item>}
            {/* <a-menu-item key="emptyCount">为空条数</a-menu-item>
            <a-menu-item key="unEmptyCount">不为空条数</a-menu-item>
            <a-menu-item key="emptyPercent">为空百分比</a-menu-item>
            <a-menu-item key="unEmptyPercent">不为空百分比</a-menu-item> */}
            {column.type && column.type === 'currency' && <a-menu-item key="zeroCount">为零条数</a-menu-item>}
            {column.type && column.type === 'currency' && <a-menu-item key="unZeroCount">不为零条数</a-menu-item>}
          </a-menu>
        </a-dropdown>
      </div>
    )
  }
}
