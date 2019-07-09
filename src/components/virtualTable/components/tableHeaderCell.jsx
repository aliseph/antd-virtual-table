export default {
  name: 'tableHeaderCell',
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
        height: column.rowSpan ? column.rowSpan * 40 + 'px' : 0,
        'line-height': column.rowSpan ? column.rowSpan * 40 + 'px' : 0,
        'z-index': column.rowSpan ? 2 : 1,
        width: column.width + 'px',
        'text-align': column.align ? column.align : column.colSpan > 1 ? 'center' : 'left'
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
    return (
      <div {...props}>
        <span>{column.title}</span>
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
      </div>
    )
  }
}
