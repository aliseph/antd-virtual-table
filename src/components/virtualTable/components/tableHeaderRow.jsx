import tableHeaderCell from './tableHeaderCell'

export default {
  name: 'TableHeaderRow',
  props: {
    row: {
      type: Array,
      default: () => []
    },
    rowNum: {
      type: Number,
      default: 0
    },
    checkedCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    },
    index: {
      type: Number,
      default: 0
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
    scrollBarSize: {
      type: Number,
      default: 0
    },
    multiple: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showDropdown: null,
      actionAble: null
    }
  },
  computed: {
    indeterminate() {
      return this.checkedCount > 0 && this.totalCount > this.checkedCount
    },
    checked() {
      return this.totalCount > 0 && this.checkedCount === this.totalCount
    }
  },
  methods: {
    onCheckedChange(event) {
      this.$emit('checkedAll', event.target.checked)
    }
  },
  render() {
    const { multiple, index, row, offsetX, offsetLeft, scrollBarSize, indeterminate, checked } = this
    const leftColumns = row.filter(column => column.fixed === 'left' || column.fixed === true)
    const centerColumns = row.filter(column => !column.fixed)
    const rightColumns = row.filter(column => column.fixed === 'right')
    const rowProps = {
      class: {
        'hd-table-row': true
      },
      style: {
        'z-index': (this.rowNum - this.index) * 10
      }
    }
    const centerProps = {
      class: {
        'hd-table-row-center': true
      },
      style: {
        transform: `translate3d(${offsetLeft + -1 * offsetX}px,0,0)`
      }
    }
    const defaultCellProps = {
      class: {
        'hd-table-cell-hidden': this.index
      },
      style: {
        height: this.index ? 0 : this.rowNum * 40 + 'px',
        'line-height': this.index ? 0 : this.rowNum * 40 + 'px'
      }
    }

    const onClickPortal = () => {
      this.$emit('showColumnsDrawer')
    }

    const onSorted = (sort, column) => {
      this.$emit('sorted', sort, column)
    }
    const onInvisible = column => {
      this.$emit('invisible', column)
    }
    const onFilter = column => {
      this.$emit('filter', column)
    }

    return (
      <div {...rowProps}>
        <div class="hd-table-row-fixed-left">
          {!index && (
            <div class="hd-table-index" {...defaultCellProps}>
              {multiple && (
                <a-checkbox
                  class="hd-table-index-checkbox"
                  indeterminate={indeterminate}
                  checked={checked}
                  onChange={this.onCheckedChange}
                />
              )}
            </div>
          )}
          {!index && (
            <div class="hd-table-portal" {...defaultCellProps}>
              <a-icon type="layout" onClick={onClickPortal} />
            </div>
          )}
          {leftColumns.map(column => (
            <tableHeaderCell column={column} onSorted={onSorted} onInvisible={onInvisible} onFilter={onFilter} />
          ))}
        </div>
        <div {...centerProps}>
          {centerColumns.map(column => (
            <tableHeaderCell column={column} onSorted={onSorted} onInvisible={onInvisible} onFilter={onFilter} />
          ))}
        </div>
        <div class="hd-table-row-fixed-right">
          {rightColumns.map((column, index) => (
            <tableHeaderCell
              column={rightColumns.length - 1 === index ? { ...column, width: column.width + scrollBarSize } : column}
              onSorted={onSorted}
              onInvisible={onInvisible}
              onFilter={onFilter}
            />
          ))}
        </div>
      </div>
    )
  }
}
