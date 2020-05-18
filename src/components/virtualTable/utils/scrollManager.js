import _ from 'lodash'

export default class scrollManager {
  constructor(rowHeight, benchRows, benchColumns) {
    this.rowHeight = rowHeight
    this.benchRows = benchRows
    this.benchColumns = benchColumns
    this.indexCellWidth = 50
    this.portalCellWidth = 40
    this.totalCellWidth = this.indexCellWidth + this.portalCellWidth
  }

  initOptions(offsetX, offsetY) {
    this.lastClusterRowNum = 0
    this.lastClusterColumnNum = 0

    if (offsetX || offsetY) {
      this.onScrollLeft(offsetX || 0)
      this.onScrollTop(offsetY || 0)
    } else {
      this.offsetX = 0
      this.offsetY = 0
      this.lastStartRow = 0
      this.lastStartColumn = 0

      this.offsetTop = 0
      this.offsetBottom = 0
    }

    this.leftColumnsWidth = this.columnManager
      .leftLeafColumns()
      .reduce(
        (sum, column) => sum + (column.width ? column.width : 0),
        this.totalCellWidth
      )
    // this.rightColumnsWidth = this.columnManager
    //   .leftLeafColumns()
    //   .reduce((sum, column) => sum + (column.width ? column.width : 0), this.totalCellWidth)

    const centerColumns = this.columnManager.leafColumns()
    // 滚动区域的宽度
    this.scrollX =
      centerColumns && centerColumns.length
        ? centerColumns.reduce(
            (sum, column) => sum + (column.width ? column.width : 0),
            this.totalCellWidth + 20
          )
        : 0

    !this.offsetX && (this.offsetLeft = this.leftColumnsWidth)

    // 滚动区域的高度
    this.scrollY =
      this.rows && this.rows.length ? this.rows.length * this.rowHeight + 20 : 0

    this.remainRows = Math.floor(this.containerY / this.rowHeight)
    this.keepRows = this.remainRows + this.benchRows * 2
    this.isClusterizeY = this.keepRows < this.rows.length // 竖向是否需要虚拟化展示
    this.visibleZoneHeight = this.remainRows * this.rowHeight // 可见区域高度
    this.isScrollY =
      this.rows && this.rows.length && this.scrollY > this.containerY

    const minColumnWidth = _.min(
      this.columnManager.centerLeafColumns().map((column) => column.width)
    )

    this.remainRows = Math.floor(this.containerX / minColumnWidth)
    this.keepColumns = this.remainRows + this.benchColumns * 2
    this.isClusterizeX =
      this.keepColumns < this.columnManager.centerLeafColumns().length // 横向是否需要虚拟化展示

    this.isScrollX = this.scrollX > this.containerX
  }

  setOrder(orderBy, orderByKey) {
    this.orderBy = orderBy
    this.orderByKey = orderByKey
  }

  reset(rows, columnManager, offsetX, offsetY, $refs) {
    if ($refs && $refs.container) {
      if (this.orderBy && this.orderByKey) {
        this.rows = _.orderBy(rows, [this.orderByKey], [this.orderBy]).map(
          (row, index) => ({
            ...row,
            _index: index,
            _checked: !!row._checked,
          })
        )
      } else {
        this.rows = rows.map((row, index) => ({
          ...row,
          _index: index,
          _checked: !!row._checked,
        }))
      }

      this.columnManager = columnManager
      this.containerY = $refs.container.clientHeight - this.rowHeight // 滚动容器的高度
      this.containerX = $refs.container.clientWidth // 滚动容器的宽度

      this.initOptions(offsetX, offsetY)
      if (!offsetX && !offsetY) {
        this.updateColumnsByX()
        this.updateRowsByY()
      }
    }
    return this
  }

  updateRows(rows) {
    if (this.orderBy && this.orderByKey) {
      this.rows = _.orderBy(rows, [this.orderByKey], [this.orderBy]).map(
        (row, index) => ({
          ...row,
          _index: index,
          _checked: !!row._checked,
        })
      )
    } else {
      this.rows = rows.map((row, index) => ({
        ...row,
        _index: index,
        _checked: !!row._checked,
      }))
    }
    if (!this.isScrollY) {
      this.showRows = this.rows
    } else {
      this.showRows = this.rows.slice(
        this.lastStartRow,
        this.keepRows + this.lastStartRow
      )
    }
  }

  updateRow(row, index) {
    if (this.rows && this.rows.length > index) {
      this.rows[index] = row
    }
    if (!this.isScrollY) {
      this.showRows = this.rows
    } else {
      this.showRows = this.rows.slice(
        this.lastStartRow,
        this.keepRows + this.lastStartRow
      )
    }
    return this.rows
  }

  onScrollTop(offsetY) {
    this.offsetY = offsetY
    if (
      this.lastClusterRowNum !=
      (this.lastClusterRowNum = this.getClusterRowNum(offsetY))
    ) {
      this.lastStartRow = Math.min(
        this.lastClusterRowNum,
        this.rows.length - this.keepRows
      )

      this.updateRowsByY()
    }
    return this.lastClusterRowNum
  }
  getClusterRowNum(scrollTop) {
    return Math.max(Math.floor(scrollTop / this.rowHeight) - 2, 0)
  }
  updateRowsByY() {
    if (!this.isClusterizeY) {
      this.showRows = this.rows
    } else {
      this.offsetTop = Math.max(this.lastStartRow * this.rowHeight, 0)

      // this.offsetBottom = Math.max(
      //   this.scrollY - this.keepRows * this.rowHeight - this.offsetTop,
      //   0
      // )

      this.showRows = this.rows.slice(
        this.lastStartRow,
        this.keepRows + this.lastStartRow
      )
    }
  }

  onScrollLeft(offsetX) {
    this.offsetX = offsetX
    if (
      this.lastClusterColumnNum !=
      (this.lastClusterColumnNum = this.getClusterColumnNum(offsetX))
    ) {
      this.lastStartColumn = Math.min(
        this.lastClusterColumnNum,
        this.columnManager.leafColumns().length - this.keepColumns
      )
      this.updateColumnsByX()
    }
    return this.lastClusterColumnNum
  }
  getClusterColumnNum(scrollLeft) {
    let startColumnIndex = 0
    let scrollColumnWidth = 0
    const centerColumns = this.columnManager.centerLeafColumns()
    while (scrollColumnWidth < scrollLeft) {
      scrollColumnWidth = centerColumns
        .slice(0, ++startColumnIndex)
        .reduce((sum, column) => sum + (column.width || 0), 0)
    }
    return Math.max(startColumnIndex - 2, 0)
  }
  updateColumnsByX() {
    if (!this.isClusterizeX) {
      this.showColumns = this.columnManager.centerLeafColumns()
    } else {
      this.offsetLeft = this.columnManager
        .centerLeafColumns()
        .slice(0, this.lastStartColumn)
        .reduce(
          (sum, column) => sum + (column.width || 0),
          this.leftColumnsWidth
        )

      this.showColumns = this.columnManager
        .centerLeafColumns()
        .slice(this.lastStartColumn, this.keepColumns + this.lastStartColumn)
    }
  }
}
