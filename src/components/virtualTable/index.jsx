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
import _ from 'lodash'

export default {
  name: 'virtualTable',
  props: {
    columns: {
      type: Array,
      default: () => []
    },
    rows: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: true
    },
    cacheKey: {
      type: String,
      default: 'table'
    }
  },
  data() {
    return {
      columnManager: new ColumnManager(this.columns),
      scrollManager: new ScrollManager(),
      destroy$: new Subject(),
      wheelEvent: null,
      offsetX: 0,
      offsetLeft: 0,
      offsetY: 0,
      showDrawer: false,
      showRows: [],
      currentRows: [],
      currentColumns: [],
      filterColumns: [],
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
      showFilterBar: false
    }
  },
  watch: {
    columns() {
      this.columnManager = this.columnManager.reset(this.updateColumns(this.columns))
      this.initOptions()
    },
    rows() {
      this.lastCheckedIndex = -1
      this.initOptions()
    },
    loading() {
      if (this.loading) {
        if (this.wheelEvent) {
        }
      } else {
        this.bindWheel()
      }
    }
  },
  methods: {
    initOptions() {
      this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)

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
                y: deltaY > 0 ? 100 : deltaY < 0 ? -100 : 0
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
    updateColumns(cols = []) {
      const columns = []
      const { $slots, $scopedSlots } = this
      cols.forEach(col => {
        const { slots = {}, scopedSlots = {}, ...resetProps } = col
        const column = {
          ...resetProps
        }
        Object.keys(slots).forEach(key => {
          const name = slots[key]
          if (column[key] === undefined && $slots[name]) {
            column[key] = $slots[name].length === 1 ? $slots[name][0] : $slots[name]
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
      this.scrollManager.onScrollTop(offset)
      this.$nextTick(() => {
        this.showRows = this.scrollManager.showRows
        this.offsetY = offset
      })
    },
    renderHeader() {
      const { headerRows, currentRows, scrollX, offsetX, leftColumnsWidth, rightFixStyle, multiple } = this
      const headerProps = {
        class: {
          'hd-table-header': true,
          'hd-table-header-empty': !headerRows || !headerRows.length || !scrollX
        }
      }
      const checkedCount = this.currentRows.reduce((sum, row) => sum + (row._checked ? 1 : 0), 0)

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
        const currentDataList = this.columnManager.columnList(this.currentColumns)
        let realRecord = currentDataList.find(data => data.dataIndex == column.dataIndex)
        realRecord = realRecord ? realRecord : {}
        realRecord.show = !realRecord.show
        this.columnManager = this.columnManager.reset(this.currentColumns)
        this.initOptions()
        this.$emit('invisible', column)
      }

      const onFilter = column => {
        this.$emit('filter', column)
        if (this.filterColumns.findIndex(condition => condition.dataIndex === column.dataIndex) === -1) {
          this.filterColumns.push(column)
        }
        this.showFilterBar = true
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
      const { scrollX, offsetLeft, offsetX, rightFixStyle, showColumns, showRows, leftColumns, rightColumns } = this

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
        this.$emit('showDetail', row)
      }

      return showRows && showRows.length
        ? showRows.map((row, index) => (
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
            />
          ))
        : ''
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
        checkedObservable
      } = this
      const footerProps = {
        class: {
          'hd-table-footer': true,
          'hd-table-footer-empty': !headerRows || !headerRows.length || !scrollX
        }
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
          />
        </div>
      )
    }
  },
  mounted() {
    this.columnManager = this.columnManager.reset(this.updateColumns(this.columns))
    this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)

    this.initOptions()
    this.bindWheel()

    fromEvent(this.$refs.container, 'resize')
      .pipe(
        takeUntil(this.destroy$),
        sampleTime(300)
      )
      .subscribe(() => {
        this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)
        this.initOptions()
      })
  },
  beforeDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
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
      filterColumns,
      showFilterBar,
      currentColumns,
      columnManager,
      isAnyColumnsFilter
    } = this

    const onUpdateColumns = columns => {
      this.columnManager = this.columnManager.reset(columns)
      this.initOptions()
    }

    const resize = () => {
      this.scrollManager = this.scrollManager.reset(this.rows, this.columnManager, this.$refs)
      this.initOptions()
    }

    const onClear = () => {
      this.filterColumns = []
      this.showFilterBar = false
    }

    return (
      <div class="hd-table-container" ref="container">
        <div class={tableClass}>
          {!loading && this.renderHeader()}
          <div class="hd-table-body-container">
            {loading && (
              <div class="hd-table-spin-container">
                <a-spin />
              </div>
            )}
            {!loading && (!showRows || !showRows.length) && <div class="hd-table-placeholder">暂无数据</div>}

            <div class="hd-table-body" style={bodyStyle} ref="bodyScroll">
              <div class="hd-table-top-placeholder" ref="topPlaceholder" />
              {!loading && this.renderBody()}
            </div>
            {!loading && isScrollY && (
              <scrollbar
                ref="scrollbarY"
                scrollSize={scrollY}
                containerSize={containerY}
                value={offsetY}
                onInput={this.onScrollY}
              />
            )}
            {!loading && isScrollX && (
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
        {!loading && isAnyColumnsFilter && showRows && !!showRows.length && (
          <filterBar
            columns={filterColumns}
            value={showFilterBar}
            onInput={visible => (this.showFilterBar = visible)}
            onClear={onClear}
          />
        )}
        {!loading && currentColumns && !!currentColumns.length && (
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
  }
}
