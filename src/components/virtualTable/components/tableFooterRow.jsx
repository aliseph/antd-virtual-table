import tableFooterCell from './tableFooterCell'

export default {
  name: 'TableFooterRow',
  props: {
    rows: {
      type: Array,
      default: () => []
    },
    leftColumns: {
      type: Array,
      default: () => []
    },
    centerColumns: {
      type: Array,
      default: () => []
    },
    rightColumns: {
      type: Array,
      default: () => []
    },
    scrollX: {
      type: Number,
      default: 0
    },
    offsetLeft: {
      type: Number,
      default: 0
    },
    offsetX: {
      type: Number,
      default: 0
    },
    rightFixStyle: {
      type: Object,
      default: () => {}
    },
    checkedObservable: {
      type: Object,
      required: true
    },
    summaryRow: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      subscription: null
    }
  },
  methods: {},
  render() {
    const {
      rows,
      offsetLeft,
      scrollX,
      leftColumns,
      centerColumns,
      rightColumns,
      offsetX,
      rightFixStyle,
      checkedObservable,
      summaryRow
    } = this
    const rowProps = {
      class: {
        'hd-table-row': true
      },
      style: {
        width: scrollX + 'px'
      }
    }
    const leftPlaceholderProps = {
      class: {
        'hd-table-left-placeholder': true
      },
      style: { width: offsetLeft + 'px' }
    }
    const centerProps = {
      class: {
        'hd-table-row-center': true
      },
      style: {
        transform: `translate3d(${-1 * offsetX}px,0,0)`
      }
    }
    return (
      <div {...rowProps}>
        <div {...leftPlaceholderProps} />
        <div class="hd-table-row-fixed-left">
          <div class="hd-table-total">
            <span class="hd-table-index-no">共{rows.length}条</span>
          </div>
          {leftColumns.map((column, index) => (
            <tableFooterCell
              column={column}
              rows={rows}
              summary={summaryRow ? summaryRow[column.dataIndex] : null}
              checkedObservable={checkedObservable}
            />
          ))}
        </div>
        <div {...centerProps}>
          {centerColumns.map((column, index) => (
            <tableFooterCell
              column={column}
              rows={rows}
              summary={summaryRow ? summaryRow[column.dataIndex] : null}
              checkedObservable={checkedObservable}
            />
          ))}
        </div>
        <div class="hd-table-row-fixed-right" style={rightFixStyle}>
          {rightColumns.map((column, index) => (
            <tableFooterCell
              column={column}
              rows={rows}
              summary={summaryRow ? summaryRow[column.dataIndex] : null}
              checkedObservable={checkedObservable}
            />
          ))}
        </div>
      </div>
    )
  }
}
