import _ from 'lodash'

export default class scrollManager {
  constructor(rows, columnManager, $refs) {
    this.rowHeight = 40
    this.indexCellWidth = 50
    this.portalCellWidth = 40
    this.totalCellWidth = this.indexCellWidth + this.portalCellWidth
    if ($refs && $refs.container) {
      this.rows = rows.map((row, index) => ({
        ...row,
        _index: index,
        _checked: !!row._checked,
      }))
      this.$refs = $refs
      this.columnManager = columnManager
      this.containerY =
        $refs.container.clientHeight -
        this.rowHeight * (this.columnManager.headerColumnsRows().length + 1) // 滚动容器的高度
      this.containerX = $refs.container.clientWidth // 滚动容器的宽度

      this.initOptions()
      this.updateColumnsByX()
      this.updateRowsByY()
      this.updateZoneByX()
    }
  }

  initOptions() {
    this.offsetX = 0
    this.offsetY = 0
    this.lastStartRow = 0
    this.lastStartColumn = 0
    this.lastClusterRowNum = 0
    this.lastClusterColumnNum = 0
    this.lastScrollLeft = 0
    this.lastScrollTop = 0

    this.offsetTop = 0
    this.offsetBottom = 0

    this.leftColumnsWidth = this.columnManager
      .leftLeafColumns()
      .reduce(
        (sum, column) => sum + (column.show && column.width ? column.width : 0),
        this.totalCellWidth
      )
    this.rightColumnsWidth = this.columnManager
      .leftLeafColumns()
      .reduce(
        (sum, column) => sum + (column.show && column.width ? column.width : 0),
        this.totalCellWidth
      )

    const centerColumns = this.columnManager.leafColumns()
    // 滚动范围的宽度
    this.scrollX =
      centerColumns && centerColumns.length
        ? centerColumns.reduce(
            (sum, column) =>
              sum + (column.show && column.width ? column.width : 0),
            this.totalCellWidth + 20
          )
        : 0

    this.offsetLeft = this.leftColumnsWidth

    // 滚动范围的高度
    this.scrollY =
      this.rows && this.rows.length ? this.rows.length * this.rowHeight + 20 : 0

    this.rightFixStyle = {
      right: this.scrollX - this.containerX + 'px',
    }

    this.keepRows = 20
    this.remainRows = Math.floor(this.keepRows * 0.2)
    this.benchRows = this.keepRows - this.remainRows
    this.isClusterizeY = this.keepRows < this.rows.length
    this.visibleZoneHeight = this.remainRows * this.rowHeight
    this.isScrollY =
      this.rows && this.rows.length && this.scrollY > this.containerY

    const minColumnWidth = _.min(
      this.columnManager.centerLeafColumns().map(column => column.width)
    )

    this.keepColumns =
      Math.floor(((this.containerX / minColumnWidth) * 3) / 2) + 8
    this.remainColumns = Math.floor(this.keepColumns * 0.2)
    this.benchColumns = this.keepColumns - this.remainColumns
    this.isClusterizeX =
      this.keepColumns < this.columnManager.centerLeafColumns().length

    if (this.isClusterizeX) {
      const arr = []
      let startIndex = 0
      while (startIndex < this.columnManager.centerLeafColumns().length) {
        arr.push(
          this.columnManager
            .centerLeafColumns()
            .slice(startIndex, (startIndex += this.remainColumns))
            .reduce((sum, column) => sum + column.width, 0)
        )
      }
      this.columnsBenchWidthArr = arr
    } else {
      this.columnsBenchWidthArr = []
    }

    this.isScrollX = this.scrollX > this.containerX
  }

  setOrder(orderBy, orderByKey) {
    this.orderBy = orderBy
    this.orderByKey = orderByKey
  }

  reset(rows, columnManager, $refs) {
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
      this.$refs = $refs
      this.columnManager = columnManager
      this.containerY = $refs.container.clientHeight - this.rowHeight // 滚动容器的高度
      this.containerX = $refs.container.clientWidth // 滚动容器的宽度

      this.initOptions()
      this.updateColumnsByX()
      this.updateRowsByY()
      this.updateZoneByX()
    }
    return this
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

  bodyStyle() {
    return {
      width: this.scrollX ? this.scrollX + 'px' : '100%',
      height: this.scrollY ? this.scrollY + 'px' : '100%',
      // pointerEvents: this.isScrolling ? 'none' : '',
    }
  }

  tableClass() {
    return {
      'hd-table': true,
      'hd-table-reach-left': !this.offsetX,
      'hd-table-reach-right':
        Math.abs(this.scrollX - this.containerX - this.offsetX) < 0.001,
    }
  }

  onScrollTop(offsetY) {
    this.offsetY = offsetY
    if (
      this.lastClusterRowNum !=
      (this.lastClusterRowNum = this.getClusterRowNum(offsetY))
    ) {
      this.lastStartRow =
        this.remainRows * this.lastClusterRowNum + this.keepRows >
        this.rows.length
          ? this.rows.length - this.keepRows
          : this.remainRows * this.lastClusterRowNum

      this.updateRowsByY()
    }
    return this.lastClusterRowNum
    // this.$refs.bodyScroll.style.transform = `translate3d(0,${-1 * this.offsetY}px,0)`
  }
  getClusterRowNum(scrollTop) {
    return Math.floor(scrollTop / this.visibleZoneHeight) || 0
  }
  updateRowsByY() {
    if (!this.isClusterizeY) {
      this.showRows = this.rows
    } else {
      this.offsetTop = this.lastStartRow * this.rowHeight
      this.offsetTop = this.offsetTop <= 0 ? 0 : this.offsetTop

      this.offsetBottom =
        this.scrollY - this.keepRows * this.rowHeight - this.offsetTop
      this.offsetBottom = this.offsetBottom <= 0 ? 0 : this.offsetBottom

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
      this.lastStartColumn = this.remainColumns * this.lastClusterColumnNum
      this.updateColumnsByX()
      this.updateZoneByX()
    }
  }
  getClusterColumnNum(scrollLeft) {
    let temp = scrollLeft
    return this.columnsBenchWidthArr.findIndex(width => (temp -= width) <= 0)
  }
  updateColumnsByX() {
    if (!this.isClusterizeX) {
      this.showColumns = this.columnManager.centerLeafColumns()
    } else {
      this.showColumns = this.columnManager
        .centerLeafColumns()
        .slice(this.lastStartColumn, this.keepColumns + this.lastStartColumn)
    }
  }
  updateZoneByX() {
    this.offsetLeft = this.columnsBenchWidthArr
      .slice(0, this.lastClusterColumnNum)
      .reduce((sum, width) => sum + width, this.leftColumnsWidth)
  }
}
