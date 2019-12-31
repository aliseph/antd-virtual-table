import tableCell from './tableCell'

export default {
  name: 'TableRow',
  props: {
    row: {
      type: Object,
      default: () => {},
    },
    leftColumns: {
      type: Array,
      default: () => [],
    },
    centerColumns: {
      type: Array,
      default: () => [],
    },
    rightColumns: {
      type: Array,
      default: () => [],
    },
    scrollX: {
      type: Number,
      default: 0,
    },
    offsetLeft: {
      type: Number,
      default: 0,
    },
    offsetX: {
      type: Number,
      default: 0,
    },
    valign: {
      type: String,
      default: 'middle',
    },
  },
  data() {
    return {}
  },
  methods: {
    onCheckedChange(event) {
      this.$emit('checked', event.target.checked)
      // this.$emit('changeRow', { ...this.row, _checked: event.target.checked })
    },
  },
  render() {
    const {
      row,
      scrollX,
      offsetX,
      offsetLeft,
      leftColumns,
      centerColumns,
      rightColumns,
    } = this
    const rowProps = {
      class: {
        'hd-table-row': true,
        'hd-table-row-checked': row._checked,
      },
      // style: {
      //   width: scrollX + 'px'
      // },
      on: {
        click: event => {
          event.stopPropagation()
          this.$emit('checked', !row._checked)
        },
      },
    }
    const centerProps = {
      class: {
        'hd-table-row-center': true,
      },
      style: {
        transform: `translate3d(${offsetLeft + -1 * offsetX}px,0,0)`,
      },
    }

    const onShowDetail = event => {
      event.stopPropagation()
      this.$emit('showDetail', row)
    }

    const onDblclickRow = row => {
      this.$emit('dblclickRow', row)
    }

    return (
      <div {...rowProps}>
        <div class="hd-table-row-fixed-left">
          <div class="hd-table-index" title={row._index + 1}>
            <span class="hd-table-index-no">{row._index + 1}</span>
            <a-checkbox
              class="hd-table-index-checkbox"
              checked={row._checked}
              onChange={this.onCheckedChange}
            />
          </div>
          <div class="hd-table-portal">
            <a-icon type="layout" onClick={onShowDetail} />
          </div>
          {leftColumns.map((column, index) => (
            <tableCell
              column={column}
              record={row}
              key={index}
              onDblclickRow={onDblclickRow}
            />
          ))}
        </div>
        <div {...centerProps}>
          {centerColumns.map((column, index) => (
            <tableCell
              column={column}
              record={row}
              key={column.dateIndex + '_' + index}
              onDblclickRow={onDblclickRow}
            />
          ))}
        </div>
        <div class="hd-table-row-fixed-right">
          {rightColumns.map((column, index) => (
            <tableCell
              column={column}
              record={row}
              key={index}
              onDblclickRow={onDblclickRow}
            />
          ))}
        </div>
      </div>
    )
  },
}
