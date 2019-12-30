import _ from 'lodash'
export default class columnManager {
  constructor(columns) {
    this.columns = columns.map(column => ({
      ...column
    }))
    this._cached = {}
  }

  treeToArray(tree, id = 'id', pid = 'pid', children = 'children') {
    const result = []
    let temp = []
    tree.forEach((item, index) => {
      result.push(item)
      if (item[children]) {
        temp = this.treeToArray(item[children], id, pid, children)
        temp.map(_item => {
          _item[pid] = item[id]
          return _item
        })
        result.push(...temp)
      }
    })
    return result
  }

  columnList(columns) {
    return this.treeToArray(columns, 'dataIndex', 'parentDataIndex')
  }

  isAnyColumnsFilter() {
    return this._cache('isAnyColumnsFilter', () => {
      return this.columnList(this.columns).some(column => !!column.filter)
    })
  }

  isAnyColumnsLeftFixed() {
    return this._cache('isAnyColumnsLeftFixed', () => {
      return this.columns.some(column => column.fixed === 'left' || column.fixed === true)
    })
  }

  isAnyColumnsRightFixed() {
    return this._cache('isAnyColumnsRightFixed', () => {
      return this.columns.some(column => column.fixed === 'right')
    })
  }

  centerColumns() {
    return this._cache('centerColumns', () => {
      return this.groupedColumns().filter(column => column.show && !column.fixed)
    })
  }

  leftColumns() {
    return this._cache('leftColumns', () => {
      return this.groupedColumns().filter(column => column.show && (column.fixed === 'left' || column.fixed === true))
    })
  }

  rightColumns() {
    return this._cache('rightColumns', () => {
      return this.groupedColumns().filter(column => column.show && column.fixed === 'right')
    })
  }

  leafColumns() {
    return this._cache('leafColumns', () => this._leafColumns(this.columns))
  }

  centerLeafColumns() {
    return this._cache('centerLeafColumns', () => this._leafColumns(this.centerColumns()))
  }

  leftLeafColumns() {
    return this._cache('leftLeafColumns', () => this._leafColumns(this.leftColumns()))
  }

  rightLeafColumns() {
    return this._cache('rightLeafColumns', () => this._leafColumns(this.rightColumns()))
  }

  // add appropriate rowspan and colspan to column
  groupedColumns() {
    return this._cache('groupedColumns', () => {
      const _groupColumns = (columns, currentRow = 0, parentColumn = {}, rows = []) => {
        // track how many rows we got
        rows[currentRow] = rows[currentRow] || []
        const grouped = []
        const setRowSpan = column => {
          const rowSpan = rows.length - currentRow
          if (
            column &&
            !column.children && // parent columns are supposed to be one row
            rowSpan > 1 &&
            (!column.rowSpan || column.rowSpan < rowSpan)
          ) {
            column.rowSpan = rowSpan
          }
        }
        columns.forEach((column, index) => {
          const newColumn = { ...column }
          rows[currentRow].push(newColumn)
          parentColumn.colSpan = parentColumn.colSpan || 0
          if (newColumn.children && newColumn.children.length > 0) {
            newColumn.children = _groupColumns(newColumn.children, currentRow + 1, newColumn, rows)
            parentColumn.colSpan += newColumn.colSpan
          } else {
            parentColumn.colSpan++
          }
          // update rowspan to all same row columns
          for (let i = 0; i < rows[currentRow].length - 1; ++i) {
            setRowSpan(rows[currentRow][i])
          }
          // last column, update rowspan immediately
          if (index + 1 === columns.length) {
            setRowSpan(newColumn)
          }
          grouped.push(newColumn)
        })
        return grouped
      }
      return _groupColumns(this.columns)
    })
  }

  headerColumnsRows() {
    return this._cache('headerColumnsRows', () => this._getHeaderRows(this.columns))
  }

  _getHeaderRows(columns) {
    let maxLevel = 1
    const traverse = (column, parent) => {
      if (parent) {
        column.level = parent.level + 1
        if (maxLevel < column.level) {
          maxLevel = column.level
        }
      }
      if (column.children) {
        let colSpan = 0
        column.children.forEach(subColumn => {
          traverse(subColumn, column)
          colSpan += subColumn.colSpan
        })
        column.colSpan = colSpan
      } else {
        column.colSpan = 1
      }
    }

    columns.forEach(column => {
      column.level = 1
      traverse(column)
    })

    const rows = []
    for (let i = 0; i < maxLevel; i++) {
      rows.push([])
    }

    const getAllColumns = columns => {
      const _columns = _.cloneDeep(columns)
      const result = []
      _columns.forEach(column => {
        if (column.show) {
          result.push(column)

          if (column.children) {
            result.push.apply(result, getAllColumns(column.children))
          }
        }
      })
      return result
    }

    const allColumns = getAllColumns(columns)

    allColumns.forEach(column => {
      if (!column.children) {
        column.rowSpan = maxLevel - column.level + 1
        for (let i = column.level - 1; i < maxLevel; i++) {
          if (i === column.level - 1) {
            rows[i].push(column)
          } else {
            rows[i].push({
              ...column,
              rowSpan: 0
            })
          }
        }
      } else {
        column.rowSpan = 1
        rows[column.level - 1].push(column)
      }
    })

    return rows
  }

  // _getHeaderRows(columns, currentRow = 0, rows) {
  //   rows = rows || []
  //   rows[currentRow] = rows[currentRow] || []

  //   columns.forEach(column => {
  //     if (column.rowSpan && rows.length < column.rowSpan) {
  //       while (rows.length < column.rowSpan) {
  //         rows.push([])
  //       }
  //     }
  //     const cell = {
  //       key: column.key,
  //       className: column.className || column.class || '',
  //       children: column.title,
  //       width: column.width,
  //       fixed: column.fixed,
  //       column
  //     }
  //     if (column.children) {
  //       this._getHeaderRows(column.children, currentRow + 1, rows)
  //     }
  //     if ('colSpan' in column) {
  //       cell.colSpan = column.colSpan
  //     }
  //     if ('rowSpan' in column) {
  //       cell.rowSpan = column.rowSpan
  //     }
  //     if (cell.colSpan !== 0) {
  //       rows[currentRow].push(cell)
  //     }
  //   })
  //   return rows.filter(row => row.length > 0)
  // }

  reset(columns) {
    this.columns = columns
    this._cached = {}
    return this
  }

  _cache(name, fn) {
    if (name in this._cached) {
      return this._cached[name]
    }
    this._cached[name] = fn()
    return this._cached[name]
  }

  _leafColumns(columns) {
    const leafColumns = []
    columns.forEach(column => {
      if (!column.children) {
        leafColumns.push(column)
      } else {
        leafColumns.push(...this._leafColumns(column.children))
      }
    })
    return leafColumns
  }
}
