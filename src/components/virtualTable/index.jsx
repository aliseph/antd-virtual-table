import { animationFrameScheduler, fromEvent, Subject } from 'rxjs'
import { tap, sampleTime, takeUntil, map } from 'rxjs/operators'
import ColumnManager from './utils/columnManager'
import ScrollManager from './utils/scrollManager'
import tableRow from './components/tableRow.jsx'
import tableHeaderRow from './components/tableHeaderRow.jsx'
import tableFooterRow from './components/tableFooterRow.jsx'
import filterBar from './components/filterBar'
import columnsDrawer from './components/columnsDrawer'
import './index.less'

export default {
  name: 'VirtualTable',
  props: {
    columns: {
      type: Array,
      default: () => [],
    },
    rows: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    showFooter: {
      type: Boolean,
      default: true,
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    cacheKey: {
      type: String,
      default: 'table',
    },
    summaryRow: {
      type: Object,
    },
    rowClassName: {
      type: Function,
    },
    defaultFilter: {
      type: Array,
      default: () => [],
    },
    rowHeight: {
      type: Number,
      default: 40,
    },
    benchRows: {
      type: Number,
      default: 2,
    },
    benchColumns: {
      type: Number,
      default: 2,
    },
  },
  data() {
    return {
      lastCheckedIndex: -1,
      checkedObservable: new Subject(),
      showColumnsDrawer: false,
      isAnyColumnsFilter: false,
      filterColumns: [],
      filterVisible: false,
      columnManager: new ColumnManager(this.columns),
      scrollManager: new ScrollManager(
        this.rowHeight,
        this.benchRows,
        this.benchColumns
      ),
      destroy$: new Subject(),
      initObservable: new Subject(),
      initSubscription: null,
      updateObservable: new Subject(),
      updateSubscription: null,
      scrollEvent: null,
      showDrawer: false,
      currentRows: [],
      currentColumns: [],
      headerRows: [], // 表头数组
      scrollX: 0, // 滚动区域的宽度
      scrollY: 0, // 滚动区域的高度
      containerX: 0, // 滚动容器的宽度
      // containerY: 0, // 滚动容器的高度
      isScrollX: false,
      isScrollY: false,
      leftColumns: [],
      rightColumns: [],
      leftColumnsWidth: 0,
      // rightColumnsWidth: 0,
      scrollBarSize: 0,
      // 以下为滚动中变量
      showRows: [], // 可见行
      showColumns: [], // 可见列
      offsetX: 0, // 滚动条横向滚动量
      offsetLeft: 0, // 滚动后可见区域横向偏移量
      offsetY: 0, // 滚动条竖向滚动量
      offsetTop: 0, // 滚动后可见区域竖向偏移量
      isReachRight: false,
    }
  },
  watch: {
    columns(columns) {
      this.columnManager = this.columnManager.reset(this.updateColumns(columns))
      this.filterColumns = [...this.defaultFilter]
      this.initObservable.next()
    },
    rows(rows, oldRows) {
      this.lastCheckedIndex = -1
      this.filterColumns = [...this.defaultFilter]
      if (rows.length != oldRows.length) {
        !this.loading && this.initObservable.next()
      } else {
        !this.loading && this.updateRows()
      }
    },
    loading(value) {
      // eslint-disable-next-line no-console
      console.log('---loading---')
      this.scrollTop()

      if (!value) {
        this.filterColumns = [...this.defaultFilter]
        this.initObservable.next()
      }
    },
  },
  methods: {
    initOptions() {
      this.scrollManager = this.scrollManager.reset(
        this.filterRows(),
        this.columnManager,
        this.offsetX,
        this.offsetY,
        this.$refs
      )

      this.showColumns = this.scrollManager.showColumns
      this.showRows = this.scrollManager.showRows
      this.offsetLeft = this.scrollManager.offsetLeft
      this.offsetTop = this.scrollManager.offsetTop
      this.headerRows = this.columnManager.headerColumnsRows()
      this.currentColumns = this.columnManager.columns
      this.leftColumns = this.columnManager.leftLeafColumns()
      this.rightColumns = this.columnManager.rightLeafColumns()
      this.currentRows = this.scrollManager.rows
      this.scrollX = this.scrollManager.scrollX
      this.isReachRight = !this.isScrollX
      this.scrollY = this.scrollManager.scrollY
      this.isScrollX = this.scrollManager.isScrollX
      this.isScrollY = this.scrollManager.isScrollY
      this.containerX = this.scrollManager.containerX
      // this.containerY = this.scrollManager.containerY
      this.leftColumnsWidth = this.scrollManager.leftColumnsWidth
      // this.rightColumnsWidth = this.scrollManager.rightColumnsWidth

      this.isAnyColumnsFilter = this.columnManager.isAnyColumnsFilter()
      this.$nextTick(() => {
        this.checkedObservable.next()
        if (this.isScrollY) {
          this.scrollBarSize =
            this.containerX - this.$refs.bodyScroll.clientWidth
        } else {
          this.scrollBarSize = 0
        }
      })
    },
    bindScroll() {
      this.scrollEvent = fromEvent(this.$refs.scrollContainer, 'scroll')
        .pipe(
          takeUntil(this.destroy$),
          tap((event) => {
            if (
              event.target.scrollLeft + event.target.clientWidth ==
              event.target.scrollWidth
            ) {
              this.isReachRight = true
              this.$emit('reach-right')
            } else {
              this.isReachRight = false
            }
            if (
              event.target.scrollTop + event.target.clientHeight ==
              event.target.scrollHeight
            ) {
              this.$emit('reach-bottom')
            }
          }),
          map((event) => {
            const { scrollTop, scrollLeft } = event.target
            return {
              x: scrollLeft,
              y: scrollTop,
            }
          })
        )
        .subscribe((offset) => {
          this.$emit('scroll', offset)
          this.onScroll(offset)
        })
    },
    scrollTop() {
      this.syncScroll(0, 0)
    },
    onScroll(offset) {
      let update = false
      if (this.offsetX !== offset.x) {
        this.offsetX = offset.x
        const lastClusterColumnNum = this.scrollManager.lastClusterColumnNum
        update =
          update ||
          lastClusterColumnNum != this.scrollManager.onScrollLeft(this.offsetX)
      }
      if (this.offsetY !== offset.y) {
        this.offsetY = offset.y
        const lastClusterRowNum = this.scrollManager.lastClusterRowNum
        update =
          update ||
          lastClusterRowNum != this.scrollManager.onScrollTop(this.offsetY)
      }

      if (update) {
        this.updateObservable.next()
      }
    },
    syncScroll(offsetX, offsetY) {
      this.$refs.scrollContainer.scrollLeft = offsetX
      this.$refs.scrollContainer.scrollTop = offsetY
      this.onScroll({ x: offsetX, y: offsetY })
    },
    updateTable() {
      this.showColumns = this.scrollManager.showColumns
      this.offsetLeft = this.scrollManager.offsetLeft

      this.showRows = this.scrollManager.showRows
      this.offsetTop = this.scrollManager.offsetTop
    },
    updateRows() {
      this.scrollManager.updateRows(this.rows)
    },
    updateColumns(cols = []) {
      const columns = []
      const { $slots, $scopedSlots } = this
      cols.forEach((col) => {
        const { slots = {}, scopedSlots = {}, ...resetProps } = col
        const column = {
          ...resetProps,
        }
        Object.keys(slots).forEach((key) => {
          const name = slots[key]
          if (column[key] === undefined && $slots[name]) {
            column[key] =
              $slots[name].length === 1 ? $slots[name][0] : $slots[name]
          }
        })
        Object.keys(scopedSlots).forEach((key) => {
          const name = scopedSlots[key]
          if (column[key] === undefined && $scopedSlots[name]) {
            column[key] = $scopedSlots[name]
          }
        })
        // if (slotScopeName && $scopedSlots[slotScopeName]) {
        //   column.customRender = column.customRender || $scopedSlots[slotScopeName]
        // }
        if (col.children) {
          column.children = this.updateColumns(column.children)
        }
        columns.push(column)
      })
      return columns
    },
    filterRows() {
      let currentRows = [...this.rows]
      this.filterColumns.forEach((column) => {
        if (column.symbol) {
          switch (column.symbol) {
            case 'like':
              currentRows = currentRows.filter((row) =>
                row[column.dataIndex].includes(column.condition)
              )
              break
            case 'eq':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] == column.condition
              )
              break
            case 'ne':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] != column.condition
              )
              break
            case 'isNull':
              currentRows = currentRows.filter(
                (row) =>
                  row[column.dataIndex] == null ||
                  row[column.dataIndex] == undefined
              )
              break
            case 'isNotNull':
              currentRows = currentRows.filter(
                (row) =>
                  row[column.dataIndex] != null &&
                  row[column.dataIndex] != undefined
              )
              break
            case 'gt':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] > column.condition
              )
              break
            case 'ge':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] >= column.condition
              )
              break
            case 'lt':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] < column.condition
              )
              break
            case 'le':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] <= column.condition
              )
              break
            case 'eqzero':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] == 0
              )
              break
            case 'nezero':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] != 0
              )
              break
            case 'ltzero':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] < 0
              )
              break
            case 'gtzero':
              currentRows = currentRows.filter(
                (row) => row[column.dataIndex] > 0
              )
              break
            default:
              break
          }
        }
      })
      return currentRows
    },
    renderHeader() {
      const {
        headerRows,
        currentRows,
        scrollX,
        offsetX,
        leftColumnsWidth,
        scrollBarSize,
        multiple,
      } = this
      const headerProps = {
        key: 'table-header',
        class: {
          'hd-table-header': true,
          'hd-table-header-empty':
            !headerRows || !headerRows.length || !scrollX,
        },
      }
      const checkedCount = this.currentRows.reduce(
        (sum, row) => sum + (row._checked ? 1 : 0),
        0
      )

      const onCheckedAll = (checked) => {
        this.currentRows = this.currentRows.map((row, index) => {
          row = { ...row, _checked: checked }
          this.scrollManager.updateRow(row, index)
          return row
        })
        this.showRows = this.scrollManager.showRows
        this.$emit('checked', checked ? this.currentRows : [])
      }

      const onShowColumnsDrawer = () => {
        this.showColumnsDrawer = true
      }

      const onSorted = (sort, column) => {
        this.$emit('sorted', sort, column)
        this.scrollManager.setOrder(sort, column.dataIndex)
        this.initOptions()
      }

      const onInvisible = (column) => {
        const currentDataList = this.columnManager.columnList(
          this.currentColumns
        )
        let realRecord = currentDataList.find(
          (data) => data.dataIndex == column.dataIndex
        )
        realRecord = realRecord || {}
        realRecord.show = !realRecord.show
        this.columnManager = this.columnManager.reset(this.currentColumns)
        this.initOptions()
        // this.$nextTick(() => this.scrollTop())
        this.$emit('invisible', column)
      }

      const onFilter = (column) => {
        // this.$emit("filter", column);
        const index = this.filterColumns.findIndex(
          (col) => col.dataIndex == column.dataIndex
        )
        if (index > -1) {
          this.filterColumns.splice(index, 1)
        } else {
          this.filterColumns.push({ ...column })
        }
        this.filterVisible = true
      }

      const onResize = (column, width) => {
        const currentDataList = this.columnManager.columnList(
          this.currentColumns
        )
        let realRecord = currentDataList.find(
          (data) => data.dataIndex == column.dataIndex
        )
        realRecord = realRecord || {}
        realRecord.width = width
        this.columnManager = this.columnManager.reset(this.currentColumns)
        this.initOptions()
      }

      return (
        <div {...headerProps}>
          {headerRows.map((row, index) => (
            <tableHeaderRow
              key={index}
              index={index}
              multiple={multiple}
              checkedCount={checkedCount}
              totalCount={currentRows.length}
              offsetX={offsetX}
              offsetLeft={leftColumnsWidth}
              scrollBarSize={scrollBarSize}
              rowNum={headerRows.length}
              row={row}
              onCheckedAll={onCheckedAll}
              onShowColumnsDrawer={onShowColumnsDrawer}
              onSorted={onSorted}
              onInvisible={onInvisible}
              onFilter={onFilter}
              onResize={onResize}
            />
          ))}
        </div>
      )
    },
    renderBody() {
      const {
        offsetLeft,
        offsetX,
        showColumns,
        showRows,
        leftColumns,
        rightColumns,
        rowClassName,
      } = this
      const onChecked = (checked, row, index) => {
        const _row = { ...row, _checked: checked }
        if (this.multiple) {
          this.$set(this.showRows, index, _row)
          this.currentRows = this.scrollManager.updateRow(_row, _row._index)
          const checkedRows = this.currentRows.filter((row) => row._checked)
          this.$emit('checked', checkedRows)
          this.checkedObservable.next(checkedRows)
        } else {
          if (this.lastCheckedIndex == -1 && checked) {
            this.lastCheckedIndex = row._index
          } else if (this.lastCheckedIndex != -1 && checked) {
            this.scrollManager.updateRow(
              { ...this.currentRows[this.lastCheckedIndex], _checked: false },
              this.lastCheckedIndex
            )
            this.lastCheckedIndex = row._index
          }

          this.currentRows = this.scrollManager.updateRow(_row, _row._index)
          this.showRows = this.scrollManager.showRows
          this.$set(this.showRows, index, _row)
          const checkedRows = [_row]
          this.$emit('checked', checkedRows)
          this.checkedObservable.next(checkedRows)
        }
      }

      const onShowDetail = (row) => {
        this.$emit('showDetail', row, row._index)
      }

      const onDblclickRow = (row) => {
        event.stopPropagation()
        this.$emit('dblclick-row', row, row._index)
      }

      return showRows.map((row, index) => (
        <tableRow
          class={rowClassName && rowClassName(row, index)}
          dataIndex={index}
          key={index}
          offsetX={offsetX}
          offsetLeft={offsetLeft}
          row={row}
          centerColumns={showColumns}
          leftColumns={leftColumns}
          rightColumns={rightColumns}
          onChecked={(checked) => onChecked(checked, row, index)}
          onShowDetail={onShowDetail}
          onDblclickRow={onDblclickRow}
          style={{
            transform: `translate3d(${this.offsetX}px,${this.offsetTop}px,0)`,
          }}
        />
      ))
    },
    renderFooter() {
      const {
        scrollX,
        headerRows,
        currentRows,
        scrollBarSize,
        offsetX,
        offsetLeft,
        showColumns,
        leftColumns,
        rightColumns,
        checkedObservable,
        summaryRow,
      } = this
      const footerProps = {
        key: 'table-footer',
        class: {
          'hd-table-footer': true,
          'hd-table-footer-empty':
            !headerRows || !headerRows.length || !scrollX,
        },
      }
      return (
        <div {...footerProps}>
          <tableFooterRow
            scrollBarSize={scrollBarSize}
            offsetX={offsetX}
            offsetLeft={offsetLeft}
            rows={currentRows}
            centerColumns={showColumns}
            leftColumns={leftColumns}
            rightColumns={rightColumns}
            checkedObservable={checkedObservable}
            summaryRow={summaryRow}
          />
        </div>
      )
    },
  },
  mounted() {
    this.columnManager = this.columnManager.reset(
      this.updateColumns(this.columns)
    )
    this.scrollManager = this.scrollManager.reset(
      this.rows,
      this.columnManager,
      this.offsetX,
      this.offsetY,
      this.$refs
    )

    this.bindScroll()

    this.initSubscription = this.initObservable
      .pipe(takeUntil(this.destroy$), sampleTime(0, animationFrameScheduler))
      .subscribe(() => {
        !this.loading && this.initOptions()
      })

    this.initObservable.next()

    this.updateSubscription = this.updateObservable
      .pipe(takeUntil(this.destroy$), sampleTime(0, animationFrameScheduler))
      .subscribe((offset) => {
        this.updateTable(offset)
      })

    fromEvent(this.$refs.container, 'resize')
      .pipe(takeUntil(this.destroy$), sampleTime(0, animationFrameScheduler))
      .subscribe(() => {
        this.scrollManager = this.scrollManager.reset(
          this.rows,
          this.columnManager,
          this.$refs
        )
        this.initObservable.next()
      })
  },
  beforeDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
    this.updateSubscription.unsubscribe()
    this.initSubscription.unsubscribe()
  },
  render() {
    const {
      loading,
      showFooter,
      scrollX,
      scrollY,
      offsetX,
      showRows,
      isReachRight,
      currentColumns,
      columnManager,
      isAnyColumnsFilter,
    } = this
    const onUpdateColumns = (columns) => {
      this.columnManager = this.columnManager.reset(columns)
      this.initOptions()
    }

    // const resize = () => {
    //   this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)
    //   this.initOptions()
    // }

    const onFilter = (columns) => {
      this.filterColumns = [...columns]
      this.$emit('filter', this.filterColumns)
      this.scrollTop()
      this.initOptions()
    }

    return (
      <div class="hd-table-container" ref="container" key="container">
        <div
          class={{
            'hd-table': true,
            'hd-table-loading': loading,
            'hd-table-reach-left': !offsetX,
            'hd-table-reach-right': isReachRight,
          }}
        >
          {this.renderHeader()}
          <div
            class="hd-table-body-container"
            ref="scrollContainer"
            key="bodyContainer"
          >
            <div class="hd-table-spin-container">
              <a-spin />
            </div>
            {(!showRows || !showRows.length) && (
              <div class="hd-table-placeholder">
                <a-empty
                  class=" ant-empty-normal"
                  image="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAxKSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgIDxlbGxpcHNlIGZpbGw9IiNGNUY1RjUiIGN4PSIzMiIgY3k9IjMzIiByeD0iMzIiIHJ5PSI3Ii8+CiAgICA8ZyBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0iI0Q5RDlEOSI+CiAgICAgIDxwYXRoIGQ9Ik01NSAxMi43Nkw0NC44NTQgMS4yNThDNDQuMzY3LjQ3NCA0My42NTYgMCA0Mi45MDcgMEgyMS4wOTNjLS43NDkgMC0xLjQ2LjQ3NC0xLjk0NyAxLjI1N0w5IDEyLjc2MVYyMmg0NnYtOS4yNHoiLz4KICAgICAgPHBhdGggZD0iTTQxLjYxMyAxNS45MzFjMC0xLjYwNS45OTQtMi45MyAyLjIyNy0yLjkzMUg1NXYxOC4xMzdDNTUgMzMuMjYgNTMuNjggMzUgNTIuMDUgMzVoLTQwLjFDMTAuMzIgMzUgOSAzMy4yNTkgOSAzMS4xMzdWMTNoMTEuMTZjMS4yMzMgMCAyLjIyNyAxLjMyMyAyLjIyNyAyLjkyOHYuMDIyYzAgMS42MDUgMS4wMDUgMi45MDEgMi4yMzcgMi45MDFoMTQuNzUyYzEuMjMyIDAgMi4yMzctMS4zMDggMi4yMzctMi45MTN2LS4wMDd6IiBmaWxsPSIjRkFGQUZBIi8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K"
                ></a-empty>
              </div>
            )}

            <div
              class="hd-table-body"
              key="table-body"
              style={{
                width: '100%',
                height: scrollY ? scrollY + 'px' : 'auto',
              }}
              ref="bodyScroll"
            >
              <div
                class="hd-table-top-placeholder"
                ref="topPlaceholder"
                key="topPlaceholder"
                style={{
                  width: scrollX + 'px',
                }}
              />
              {this.renderBody()}
            </div>
          </div>
          {showFooter && this.renderFooter()}
        </div>
        {isAnyColumnsFilter && (
          <filterBar
            columns={this.filterColumns}
            onFilter={onFilter}
            value={this.filterVisible}
            onInput={(value) => (this.filterVisible = value)}
          />
        )}
        {!!currentColumns && !!currentColumns.length && (
          <columnsDrawer
            value={this.showColumnsDrawer}
            onInput={(visible) => (this.showColumnsDrawer = visible)}
            columns={currentColumns}
            columnManager={columnManager}
            onUpdateColumns={onUpdateColumns}
            ref="columnsDrawer"
          />
        )}
      </div>
    )
  },
}
