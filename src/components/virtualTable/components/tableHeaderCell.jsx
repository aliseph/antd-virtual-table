export default {
  name: 'TableHeaderCell',
  props: {
    column: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      showDropdown: false,
      actionAble: false,
      sort: ''
    }
  },
  render() {
    const column = this.column
    const props = {
      attrs: {
        rowspan: column.rowSpan,
        colspan: column.colSpan
      },
      class: {
        'hd-table-cell': true,
        'hd-table-cell-hidden': !column.rowSpan || !column.colSpan
      },
      style: {
        position: 'relative',
        height: column.rowSpan ? column.rowSpan * 40 + 'px' : 0,
        'line-height': column.rowSpan ? column.rowSpan * 40 + 'px' : 0,
        'z-index': column.rowSpan ? 2 : 1,
        width: column.width + 'px',
        'text-align': column.align ? column.align : column.colSpan > 1 ? 'center' : 'left'
      }
    }

    const titleProps = {
      style: {
        'font-weight': column.bold ? 'bold' : 'normal'
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

    const onClick = ({ key }) => {
      this.currentKey = key
      switch (key) {
        case 'asc':
          this.sort = this.sort !== 'asc' ? 'asc' : ''
          this.actionAble = !!this.sort
          this.$emit('sorted', this.sort, this.column)
          break
        case 'desc':
          this.sort = this.sort !== 'desc' ? 'desc' : ''
          this.actionAble = !!this.sort
          this.$emit('sorted', this.sort, this.column)
          break
        case 'invisible':
          this.$emit('invisible', this.column)
          break
        case 'filter':
          this.$emit('filter', this.column)
          break
        default:
          break
      }

      this.showDropdown = false
    }
    let width = this.column.width
    const onDrag = x => {
      width = 0
      this.$emit('resize', this.column, Math.max(x, 1))
      // this.column.width = Math.max(x, 1)
    }

    const onDragstop = () => {
      width = this.$el.getBoundingClientRect().width
    }

    return (
      <div {...props}>
        <span {...titleProps}>{column.title}</span>
        {column.rowSpan > 0 && (!column.children || !column.children.length) && (
          <a-dropdown
            trigger={['click']}
            visible={this.showDropdown}
            onVisibleChange={onVisibleChange}
            placement="bottomRight"
          >
            <a-icon type="caret-down" {...actionProps} />
            <a-menu slot="overlay" onClick={onClick} selectedKeys={[this.sort]}>
              <a-menu-item key="asc">
                <a-icon type="sort-ascending" />
                正序
              </a-menu-item>
              <a-menu-item key="desc">
                <a-icon type="sort-descending" />
                倒序
              </a-menu-item>
              <a-menu-item key="invisible">
                <a-icon type="eye-invisible" />
                隐藏
              </a-menu-item>
              {column.filter && (
                <a-menu-item key="filter">
                  <a-icon type="filter" />
                  筛选
                </a-menu-item>
              )}
            </a-menu>
          </a-dropdown>
        )}
        <vue-draggable-resizable
          key={column.dataIndex}
          class="table-draggable-handle"
          style={{ right: column.width - 5 + 'px' }}
          w={10}
          x={width || column.width}
          z={2}
          axis="x"
          draggable={true}
          resizable={false}
          onDragging={onDrag}
          onDragstop={onDragstop}
        ></vue-draggable-resizable>
      </div>
    )
  }
}
