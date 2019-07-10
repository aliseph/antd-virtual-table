<template>
  <!-- <div
    ref="wrap"
    class="sheet-scroll-strip"
    :class="[horizontal ? 'sheet-scroll-strip-horizontal' : 'sheet-scroll-strip-vertical']"
    @click.stop="onClick"
  >
    <div ref="thumb" class="sheet-scroll-bar" :style="thumbStyle" @mousedown.stop="onMouseDown"></div>
  </div>-->
  <div
    :class="{
    'sheet-scrollbar-rail-x': horizontal,
    'sheet-scrollbar-rail-y': !horizontal
    }"
    ref="rail"
  >
    <div
      :class="{
    'sheet-scrollbar-thumb-x': horizontal,
    'sheet-scrollbar-thumb-y': !horizontal
    }"
      :style="thumbStyle"
      ref="thumb"
    ></div>
  </div>
</template>
<script>
import _ from 'lodash'
import {
  animationFrameScheduler,
  fromEvent,
  EMPTY,
  Subject,
  Subscription,
} from 'rxjs'
import { tap, takeUntil, filter, switchMap, map, sampleTime } from 'rxjs/operators'

export default {
  name: 'scrollbar',
  props: {
    // 是否作为横向
    horizontal: {
      type: Boolean,
      default: false
    },
    value: {
      type: Number,
      default: 0
    },
    scrollSize: {
      type: Number,
      default: 0
    },
    containerSize: {
      type: Number,
      default: 0
    },
    // 滚动条的最小长度，当滚动条长度随元素比例缩小到一定程度时不再缩小。
    minThumbLength: {
      type: Number,
      default: 40
    }
  },
  data() {
    return {
      destroy$: new Subject(),
      documentSelectstart: null,
      // 为document绑定事件, 此状态值为了避免重复绑定
      binded: false,
      // 拖动滚动条时的起始位置
      markThumbAxis: null,
      // 滚动条的宽或者高
      thumbLength: 0,
      // 滚动条空白区域 与 (用户内容元素的高度 - 视图区域的高度) 的比例
      ratio: 0,
      // 滚动条最大的偏移量。这个值等于滚动条容器 减去 滚动条 的空白区域
      maxOffset: 0,
      // 记录当前的偏移量，用于触发 滚动到头部和尾部的事件
      currentScroll: 0,
      scheduledAnimationFrame: false,
      isScrolling: false,
    }
  },
  computed: {
    config() {
      if (this.horizontal) {
        return {
          thumbLength: 'width',
          thumbWidth: 'height',
          wrapSize: 'clientWidth',
          thumbAxis: 'clientX',
          translate: 'translateX',
          direction: 'left',
          wheelDelta: 'deltaX'
        }
      }
      return {
        thumbLength: 'height', // 滚动条的长度
        thumbWidth: 'width', // 滚动条的宽度
        wrapSize: 'clientHeight', // 滚动条容器的可视高度
        thumbAxis: 'clientY', // 拖动滚动条时，鼠标移动的Y轴坐标值
        translate: 'translateY', // 上下移动滚动条的位置
        direction: 'top', // 滚动条容器的top值, 会与 clientY 发生计算
        wheelDelta: 'deltaY' // 在滚动条容器中滚动 鼠标滚轮 时， 滚动量的值
      }
    },
    thumbStyle() {
      return {
        'will-change': 'transform',
        [this.config.thumbLength]: this.thumbLength + 'px',
        // [this.config.thumbWidth]: this.thumbWidth + 'px',
      }
    },
  },
  watch: {
    value(value) {
      this.setTranslate(value * this.ratio)
    }
  },
  methods: {
    /**
     * scrollSize 如果是竖向滚动条，则为 用户内容元素的 scrollHeight, 横向的则作为 用户内容元素的 scrollWidth
     * clientSize 可视区域的 clientHeight clientWidth. 横竖的原理同scrollSize
     */
    computeStrip() {
      // 滚动条的容器高度（对于横向时为宽度）
      let currentSize = this.$refs.rail[this.config.wrapSize]
      /**
       * 滚动条长度。
       *
       * containerSize / scrollSize 是表示视图范围与用户内容元素的比例
       * 用此比例来决定 滚动条的长度 滚动条容器 * 比例 = 滚动条长度
       * 但是当用户内容元素无限大的时候，可能会导致滚动条无限小，所以会设置最小长度
       */
      let thumbLength = currentSize * (this.containerSize / this.scrollSize)

      let minThumbLength = this.minThumbLength < 1 ? currentSize * this.minThumbLength : this.minThumbLength

      // 判断是否滚动条长度是否已经小于了设置的最小长度
      this.thumbLength = thumbLength < minThumbLength ? minThumbLength : thumbLength

      // 滚动条容器 - 滚动条长度 = 剩余的空间
      this.maxOffset = Math.round(currentSize - this.thumbLength)
      /**
       * 这里计算一个比例
       * 已高度举例子:
       * 使用 剩余空间 除以 (用户内容元素的高度 - 视图区域的高度)
       * 可以把 视图区域的高度 比作 滚动条的长度 用户内容元素的高度 比作 滚动条容器的高度
       * 所以使用两者剩余空间的比例，来计算 当滚动条滑动1px的时候 用户内容元素应该滑动多少 px，当用户内容元素移动时 来计算 滚动条应该移动多少px
       */
      this.ratio = this.maxOffset / (this.scrollSize - this.containerSize)
    },
    setTranslate(offset) {
      this.currentScroll = Math.max(Math.min(offset, this.maxOffset), 0)
      if (this.horizontal) {
        this.$refs.thumb.style.transform = `translateX(${this.currentScroll}px)`
      } else {
        this.$refs.thumb.style.transform = `translateY(${this.currentScroll}px)`
      }
      this.$emit('input', Math.round(this.currentScroll / this.ratio))
    }
  },
  mounted() {
    this.computeStrip()
    const mouseDown$ =
      this.$refs.thumb && this.$refs.thumb
        ? fromEvent(this.$refs.thumb, 'mousedown')
        : EMPTY;
    const mouseMove$ = fromEvent(document, 'mousemove');
    const mouseUp$ = fromEvent(document, 'mouseup');
    const selectstart$ = fromEvent(document, 'selectstart');

    const click$ =
      this.$refs.rail && this.$refs.rail
        ? fromEvent(this.$refs.rail, 'click')
        : EMPTY;

    mouseDown$
      .pipe(
        takeUntil(this.destroy$),// 只有鼠标左键可以拖动
        filter(event => event.button === 0),
        tap(event => {
          event.stopImmediatePropagation();
          this.documentSelectstart = selectstart$
            .pipe(takeUntil(this.destroy$))
            .subscribe(e => {
              e.preventDefault()
              return false
            })
        }),
        map(event => ({
          pos: {
            x: this.horizontal ? this.currentScroll : 0,
            y: this.horizontal ? 0 : this.currentScroll,
          },
          event,
        })),
        switchMap(initialState => {
          const initialPos = initialState.pos
          const clientX = initialState.event.clientX
          const clientY = initialState.event.clientY

          return mouseMove$.pipe(
            map(moveEvent => {
              moveEvent.stopImmediatePropagation();
              if (this.horizontal) {
                return Math.round(moveEvent.clientX - clientX + initialPos.x)
              } else {
                return Math.round(moveEvent.clientY - clientY + initialPos.y)
              }
            }),
            takeUntil(
              mouseUp$.pipe(
                tap(() => {
                  this.documentSelectstart.unsubscribe()
                }),
              ),
            ),
            sampleTime(0, animationFrameScheduler),
          );
        }),
      )
      .subscribe(offset => {
        this.setTranslate(offset)
      })

    click$.pipe(
      tap(event => event.stopPropagation()),
      filter(event => event.target == this.$refs.rail)
    ).subscribe((event) => {
      let position = this.$refs.thumb.getBoundingClientRect()

      let movement = event[this.config.thumbAxis] - position[this.config.direction]

      // The next Horizontal Value will be
      let offset = this.currentScroll + movement - this.thumbLength / 2
      this.setTranslate(offset)
    })
  },
  beforeDestroy() {
    this.destroy$.next()
    this.destroy$.complete()
  },
}
</script>
<style lang="less">
@hd-scrollbar-prefix: sheet-scrollbar;
@hd-scrollbar-rail-background: rgba(229, 229, 234, 0.4);
@hd-scrollbar-thumb-background: #c5c6c7;

.@{hd-scrollbar-prefix}-rail-x,
.@{hd-scrollbar-prefix}-rail-y {
  position: absolute;
  z-index: 1000;
  opacity: 0.9;
  background-color: transparent;

  &:hover {
    background-color: @hd-scrollbar-rail-background;
    opacity: 0.9;
  }

  .@{hd-scrollbar-prefix}-thumb-x,
  .@{hd-scrollbar-prefix}-thumb-y {
    height: 100%;
    width: 100%;
    border-radius: 4px;
    background-color: @hd-scrollbar-thumb-background;
    will-change: transform;
    backface-visibility: hidden;
  }
}

.hd-table:hover .@{hd-scrollbar-prefix}-rail-x,
.hd-table:hover .@{hd-scrollbar-prefix}-rail-y {
  background-color: @hd-scrollbar-rail-background;
  opacity: 0.9;
}

.hd-table:hover .@{hd-scrollbar-prefix}-rail-x {
  height: 10px;
}

.hd-table:hover .@{hd-scrollbar-prefix}-rail-y {
  width: 10px;
}

.@{hd-scrollbar-prefix}-rail-x {
  transition: height 200ms linear, opacity 200ms linear, background-color 200ms linear;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;

  .@{hd-scrollbar-prefix}-thumb-x {
    transition: background-color 0.2s linear, height 0.2s ease-in-out;
  }
}

.@{hd-scrollbar-prefix}-rail-y {
  transition: width 200ms linear, opacity 200ms linear, background-color 200ms linear;
  right: 0;
  top: 0;
  height: 100%;
  width: 6px;

  .@{hd-scrollbar-prefix}-thumb-y {
    transition: background-color 0.2s linear, width 0.2s ease-in-out;
  }
}
</style>
