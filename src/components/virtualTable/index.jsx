import { animationFrameScheduler, fromEvent, Subject } from 'rxjs'
import { tap, sampleTime, takeUntil, map } from 'rxjs/operators'
import ColumnManager from './utils/columnManager'
import ScrollManager from './utils/scrollManager'
import tableRow from './components/tableRow.jsx'
import tableHeaderRow from './components/tableHeaderRow.jsx'
import tableFooterRow from './components/tableFooterRow.jsx'
import scrollbar from './components/scrollbar'
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
  },
  data() {
    return {
      columnManager: new ColumnManager(this.columns),
      scrollManager: new ScrollManager(),
      destroy$: new Subject(),
      updateObservable: new Subject(),
      updateSubscription: null,
      wheelEvent: null,
      scrollEvent: null,
      offsetX: 0,
      offsetLeft: 0,
      offsetY: 0,
      offsetTop: 0,
      showDrawer: false,
      showRows: [],
      currentRows: [],
      currentColumns: [],
      showColumns: [],
      headerRows: [],
      scrollX: 0,
      scrollY: 0,
      containerX: 0,
      containerY: 0,
      isScrollX: false,
      isScrollY: false,
      leftColumns: [],
      rightColumns: [],
      leftColumnsWidth: 0,
      rightFixStyle: {},
      tableClass: {},
      bodyStyle: {},
      lastCheckedIndex: -1,
      checkedObservable: new Subject(),
      showColumnsDrawer: false,
      isAnyColumnsFilter: false,
      filterColumns: [],
      filterVisible: false,
    }
  },
  watch: {
    // options () {
    //   return {
    //     root: this.loaderViewport,
    //     rootMargin: `0px 0px ${this.loaderDistance}px 0px`
    //   }
    // },
    // observer () {
    //   return new IntersectionObserver(([{ isIntersecting }]) => {
    //     isIntersecting && !this.loaderDisable && this.loaderMethod()
    //   }, this.options)
    // },
    columns() {
      this.columnManager = this.columnManager.reset(
        this.updateColumns(this.columns)
      )
      this.filterColumns = []
      this.initOptions()
    },
    rows() {
      this.lastCheckedIndex = -1
      this.filterColumns = []
      this.initOptions()
    },
    loading() {
      if (this.loading) {
      } else {
      }
    },
  },
  methods: {
    initOptions() {
      this.scrollManager = this.scrollManager.reset(
        this.filterRows(),
        this.columnManager,
        this.$refs
      )

      this.showColumns = this.scrollManager.showColumns
      this.showRows = this.scrollManager.showRows
      this.offsetLeft = this.scrollManager.offsetLeft
      this.tableClass = this.scrollManager.tableClass()
      this.bodyStyle = this.scrollManager.bodyStyle()
      this.headerRows = this.columnManager.headerColumnsRows()
      this.currentColumns = this.columnManager.columns
      this.leftColumns = this.columnManager.leftLeafColumns()
      this.rightColumns = this.columnManager.rightLeafColumns()
      this.currentRows = this.scrollManager.rows
      this.scrollX = this.scrollManager.scrollX
      this.scrollY = this.scrollManager.scrollY
      this.isScrollX = this.scrollManager.isScrollX
      this.isScrollY = this.scrollManager.isScrollY
      this.containerX = this.scrollManager.containerX
      this.containerY = this.scrollManager.containerY
      this.offsetX = this.scrollManager.offsetX
      this.rightFixStyle = this.scrollManager.rightFixStyle
      this.leftColumnsWidth = this.scrollManager.leftColumnsWidth

      this.isAnyColumnsFilter = this.columnManager.isAnyColumnsFilter()
      this.$nextTick(() => {
        this.checkedObservable.next()
      })
    },
    filterRows() {
      let currentRows = [...this.rows]
      this.filterColumns.forEach(column => {
        if (column.symbol) {
          switch (column.symbol) {
            case 'like':
              currentRows = currentRows.filter(row =>
                row[column.dataIndex].includes(column.condition)
              )
              break
            case 'eq':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] == column.condition
              )
              break
            case 'ne':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] != column.condition
              )
              break
            case 'isNull':
              currentRows = currentRows.filter(
                row =>
                  row[column.dataIndex] == null ||
                  row[column.dataIndex] == undefined
              )
              break
            case 'isNotNull':
              currentRows = currentRows.filter(
                row =>
                  row[column.dataIndex] != null &&
                  row[column.dataIndex] != undefined
              )
              break
            case 'gt':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] > column.condition
              )
              break
            case 'ge':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] >= column.condition
              )
              break
            case 'lt':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] < column.condition
              )
              break
            case 'le':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] <= column.condition
              )
              break
            case 'eqzero':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] == 0
              )
              break
            case 'nezero':
              currentRows = currentRows.filter(
                row => row[column.dataIndex] != 0
              )
              break
            case 'ltzero':
              currentRows = currentRows.filter(row => row[column.dataIndex] < 0)
              break
            case 'gtzero':
              currentRows = currentRows.filter(row => row[column.dataIndex] > 0)
              break
            default:
              break
          }
        }
      })
      return currentRows
    },
    bindWheel() {
      if (!this.wheelEvent && this.$refs.container) {
        this.wheelEvent = fromEvent(this.$refs.container, 'wheel')
          .pipe(
            takeUntil(this.destroy$),
            tap(event => event.preventDefault()),
            map(event => {
              const { deltaX, deltaY } = event
              return {
                x: deltaX > 0 ? 100 : deltaX < 0 ? -100 : 0,
                y: deltaY > 0 ? 100 : deltaY < 0 ? -100 : 0,
              }
            }),
            sampleTime(0, animationFrameScheduler)
          )
          .subscribe(offset => {
            this.offsetX += offset.x
            this.offsetY += offset.y
          })
      }
    },
    bindScroll() {
      this.scrollEvent = fromEvent(this.$refs.scrollContainer, 'scroll')
        .pipe(
          takeUntil(this.destroy$),
          tap(event => event.preventDefault()),
          sampleTime(0, animationFrameScheduler),
          map(event => {
            const { scrollTop, scrollLeft } = event.target
            return {
              x: scrollLeft,
              y: scrollTop,
            }
          })
        )
        .subscribe(offset => {
          if (this.offsetX !== offset.x) {
            this.offsetX = offset.x
            this.onScrollX(this.offsetX)
          }
          if (this.offsetY !== offset.y) {
            this.offsetY = offset.y
            this.onScrollY(this.offsetY)
          }
        })
    },
    updateColumns(cols = []) {
      const columns = []
      const { $slots, $scopedSlots } = this
      cols.forEach(col => {
        const { slots = {}, scopedSlots = {}, ...resetProps } = col
        const column = {
          ...resetProps,
        }
        Object.keys(slots).forEach(key => {
          const name = slots[key]
          if (column[key] === undefined && $slots[name]) {
            column[key] =
              $slots[name].length === 1 ? $slots[name][0] : $slots[name]
          }
        })
        Object.keys(scopedSlots).forEach(key => {
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
    onScrollX(offset) {
      this.$emit('on-scroll-x', offset)
      this.scrollManager.onScrollLeft(offset)
      this.tableClass = this.scrollManager.tableClass()

      this.$nextTick(() => {
        this.showColumns = this.scrollManager.showColumns
        this.offsetX = offset
        this.offsetLeft = this.scrollManager.offsetLeft
      })
    },
    onScrollY(offset) {
      this.$emit('on-scroll-y', offset)
      const lastClusterRowNum = this.scrollManager.lastClusterRowNum

      if (lastClusterRowNum != this.scrollManager.onScrollTop(offset)) {
        this.updateObservable.next({ y: offset })
      }
    },
    updateTable(offset) {
      console.log(offset)
      this.showRows = this.scrollManager.showRows
      this.offsetTop = this.scrollManager.offsetTop
      // this.$refs.topPlaceholder &&
      //   (this.$refs.topPlaceholder.style.height =
      //     this.scrollManager.offsetTop + 'px')

      // this.$refs.bottomPlaceholder &&
      //   (this.$refs.bottomPlaceholder.style.height =
      //     this.scrollManager.offsetBottom + 'px')
      this.offsetY = offset.y
    },
    renderHeader() {
      const {
        headerRows,
        currentRows,
        scrollX,
        offsetX,
        leftColumnsWidth,
        rightFixStyle,
        multiple,
      } = this
      const headerProps = {
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

      const onCheckedAll = checked => {
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

      const onInvisible = column => {
        const currentDataList = this.columnManager.columnList(
          this.currentColumns
        )
        let realRecord = currentDataList.find(
          data => data.dataIndex == column.dataIndex
        )
        realRecord = realRecord || {}
        realRecord.show = !realRecord.show
        this.columnManager = this.columnManager.reset(this.currentColumns)
        this.initOptions()
        this.$emit('invisible', column)
      }

      const onFilter = column => {
        // this.$emit("filter", column);
        const index = this.filterColumns.findIndex(
          col => col.dataIndex == column.dataIndex
        )
        if (index > -1) {
          this.filterColumns.splice(index, 1)
        } else {
          this.filterColumns.push({ ...column })
        }
        this.filterVisible = true
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
              scrollX={scrollX}
              offsetX={offsetX}
              offsetLeft={leftColumnsWidth}
              rightFixStyle={rightFixStyle}
              rowNum={headerRows.length}
              row={row}
              onCheckedAll={onCheckedAll}
              onShowColumnsDrawer={onShowColumnsDrawer}
              onSorted={onSorted}
              onInvisible={onInvisible}
              onFilter={onFilter}
            />
          ))}
        </div>
      )
    },
    renderBody() {
      const {
        scrollX,
        offsetLeft,
        offsetX,
        rightFixStyle,
        showColumns,
        showRows,
        leftColumns,
        rightColumns,
      } = this

      const onChecked = (checked, row, index) => {
        const _row = { ...row, _checked: checked }
        if (this.multiple) {
          this.$set(this.showRows, index, _row)
          this.currentRows = this.scrollManager.updateRow(_row, index)
          const checkedRows = this.currentRows.filter(row => row._checked)
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

      const onShowDetail = row => {
        this.$emit('showDetail', row, row._index)
      }

      const onDblclickRow = row => {
        event.stopPropagation()
        this.$emit('dblclick-row', row, row._index)
      }

      return showRows.map((row, index) => (
        <tableRow
          key={index}
          scrollX={scrollX}
          rightFixStyle={rightFixStyle}
          offsetX={offsetX}
          offsetLeft={offsetLeft}
          row={row}
          centerColumns={showColumns}
          leftColumns={leftColumns}
          rightColumns={rightColumns}
          onChecked={checked => onChecked(checked, row, index)}
          onShowDetail={onShowDetail}
          onDblclickRow={onDblclickRow}
          style={{ transform: `translate3d(0,${this.offsetTop}px,0)` }}
        />
      ))
    },
    renderFooter() {
      const {
        scrollX,
        headerRows,
        currentRows,
        rightFixStyle,
        offsetX,
        offsetLeft,
        showColumns,
        leftColumns,
        rightColumns,
        checkedObservable,
        summaryRow,
      } = this
      const footerProps = {
        class: {
          'hd-table-footer': true,
          'hd-table-footer-empty':
            !headerRows || !headerRows.length || !scrollX,
        },
      }
      return (
        <div {...footerProps}>
          <tableFooterRow
            scrollX={scrollX}
            rightFixStyle={rightFixStyle}
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
      this.$refs
    )

    this.initOptions()
    this.bindScroll()

    this.updateSubscription = this.updateObservable
      .pipe(takeUntil(this.destroy$), sampleTime(0, animationFrameScheduler))
      .subscribe(offset => {
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
        this.initOptions()
      })
  },
  beforeDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
    this.updateSubscription.unsubscribe()
  },
  render() {
    const {
      loading,
      scrollX,
      scrollY,
      containerX,
      containerY,
      isScrollX,
      isScrollY,
      tableClass,
      offsetY,
      offsetX,
      bodyStyle,
      showRows,
      currentColumns,
      columnManager,
      isAnyColumnsFilter,
    } = this

    const onUpdateColumns = columns => {
      this.columnManager = this.columnManager.reset(columns)
      this.initOptions()
    }

    // const resize = () => {
    //   this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)
    //   this.initOptions()
    // }

    const onFilter = columns => {
      this.filterColumns = columns
      console.log(this.filterColumns)
      this.$emit('filter', this.filterColumns)
      this.initOptions()
    }

    return (
      <div class="hd-table-container" ref="container">
        <div class={tableClass}>
          {!loading && this.renderHeader()}
          <div
            class="hd-table-body-container"
            ref="scrollContainer"
            key="bodyContainer"
          >
            {loading && (
              <div class="hd-table-spin-container">
                <a-spin />
              </div>
            )}
            {!loading && (!showRows || !showRows.length) && (
              <div class="hd-table-placeholder">
                <a-empty
                  class=" ant-empty-normal"
                  image="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAxKSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgIDxlbGxpcHNlIGZpbGw9IiNGNUY1RjUiIGN4PSIzMiIgY3k9IjMzIiByeD0iMzIiIHJ5PSI3Ii8+CiAgICA8ZyBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0iI0Q5RDlEOSI+CiAgICAgIDxwYXRoIGQ9Ik01NSAxMi43Nkw0NC44NTQgMS4yNThDNDQuMzY3LjQ3NCA0My42NTYgMCA0Mi45MDcgMEgyMS4wOTNjLS43NDkgMC0xLjQ2LjQ3NC0xLjk0NyAxLjI1N0w5IDEyLjc2MVYyMmg0NnYtOS4yNHoiLz4KICAgICAgPHBhdGggZD0iTTQxLjYxMyAxNS45MzFjMC0xLjYwNS45OTQtMi45MyAyLjIyNy0yLjkzMUg1NXYxOC4xMzdDNTUgMzMuMjYgNTMuNjggMzUgNTIuMDUgMzVoLTQwLjFDMTAuMzIgMzUgOSAzMy4yNTkgOSAzMS4xMzdWMTNoMTEuMTZjMS4yMzMgMCAyLjIyNyAxLjMyMyAyLjIyNyAyLjkyOHYuMDIyYzAgMS42MDUgMS4wMDUgMi45MDEgMi4yMzcgMi45MDFoMTQuNzUyYzEuMjMyIDAgMi4yMzctMS4zMDggMi4yMzctMi45MTN2LS4wMDd6IiBmaWxsPSIjRkFGQUZBIi8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4K"
                ></a-empty>
              </div>
            )}

            <div class="hd-table-body" style={bodyStyle} ref="bodyScroll">
              <div
                class="hd-table-top-placeholder"
                ref="topPlaceholder"
                key="topPlaceholder"
              />
              {!loading && this.renderBody()}
              <div
                class="hd-table-bottom-placeholder"
                ref="bottomPlaceholder"
                key="bottomPlaceholder"
              />
            </div>
            {false && !!isScrollY && (
              <scrollbar
                ref="scrollbarY"
                scrollSize={scrollY}
                containerSize={containerY}
                value={offsetY}
                onInput={this.onScrollY}
              />
            )}
            {false && !!isScrollX && (
              <scrollbar
                ref="scrollbarX"
                scrollSize={scrollX}
                containerSize={containerX}
                horizontal
                value={offsetX}
                onInput={this.onScrollX}
              />
            )}
          </div>
          {!loading && this.renderFooter()}
        </div>
        {!loading && isAnyColumnsFilter && (
          <filterBar
            columns={this.filterColumns}
            onFilter={onFilter}
            value={this.filterVisible}
            onInput={value => (this.filterVisible = value)}
          />
        )}
        {!loading && !!currentColumns && !!currentColumns.length && (
          <columnsDrawer
            value={this.showColumnsDrawer}
            onInput={visible => (this.showColumnsDrawer = visible)}
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
