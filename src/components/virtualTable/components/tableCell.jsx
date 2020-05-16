import get from 'lodash/get'

function isValidElement(element) {
  return (
    element &&
    typeof element === 'object' &&
    'componentOptions' in element &&
    'context' in element &&
    element.tag !== undefined
  ) // remove text node
}
function isInvalidRenderCellText(text) {
  return (
    text &&
    !isValidElement(text) &&
    Object.prototype.toString.call(text) === '[object Object]'
  )
}

export default {
  name: 'TableCell',
  props: {
    record: {
      type: Object,
      default: () => {},
    },
    column: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    handleClick(e) {
      const {
        record,
        column: { onCellClick },
      } = this
      if (onCellClick) {
        onCellClick(record, e)
      }
    },
    handleDblClick(e) {
      const {
        record,
        column: { onDbclick },
      } = this
      if (onDbclick) {
        onDbclick(this.column, record, e)
      }
      this.$emit('dblclickRow', record)
    },
  },
  render() {
    const { record, column } = this
    const { dataIndex, customRender, className = 'hd-table-cell' } = column
    const cls = className || column.class
    // We should return undefined if no dataIndex is specified, but in order to
    // be compatible with object-path's behavior, we return the record object instead.
    let text
    if (typeof dataIndex === 'number') {
      text = get(record, dataIndex)
    } else if (!dataIndex || dataIndex.length === 0) {
      text = record
    } else {
      text = get(record, dataIndex)
    }
    const tdProps = {
      props: {},
      attrs: {},
      class: cls,
      style: {
        width: column.width + 'px',
      },
      on: {
        click: this.handleClick,
        dblclick: this.handleDblClick,
      },
    }
    let colSpan
    let rowSpan

    if (customRender) {
      text = customRender(text, record, record._index)
      if (isInvalidRenderCellText(text)) {
        tdProps.attrs = text.attrs || {}
        tdProps.props = text.props || {}
        colSpan = tdProps.attrs.colSpan
        rowSpan = tdProps.attrs.rowSpan
        text = text.children
      }
    }

    // Fix https://github.com/ant-design/ant-design/issues/1202
    if (isInvalidRenderCellText(text)) {
      text = null
    }

    if (rowSpan === 0 || colSpan === 0) {
      return null
    }
    if (column.align) {
      tdProps.style = { textAlign: column.align, ...tdProps.style }
    }
    return <div {...tdProps}>{text}</div>
  },
}
