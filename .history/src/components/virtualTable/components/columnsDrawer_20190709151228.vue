<template>
  <a-drawer
    :visible="value"
    :wrapStyle="{
      height: 'calc(100% - 55px)',
      overflow: 'auto',
      'padding-bottom': '53px'
    }"
    :width="880"
    @close="() => $emit('input', false)"
  >
    <div slot="title">
      <a-icon type="layout" />&nbsp;&nbsp;列设置
    </div>
    <a-table
      :columns="currentColumns"
      :dataSource="currentDatas"
      :scroll="scroll"
      rowKey="dataIndex"
      :pagination=" {
        current: 1,
        pageSize: 8
      }"
      bordered
    >
      <template slot="name" slot-scope="text">
        <a-input :value="text" />
      </template>
      <template slot="width" slot-scope="text,record">
        <a-input-number
          v-model="getRealRecord(record).width"
          :min="80"
          :max="500"
          v-if="!record.children||!record.children.length"
        />
        <span v-else>{{record.width}}</span>
      </template>
      <template slot="show" slot-scope="text,record">
        <a-icon
          :type="getRealRecord(record).show?'eye':'eye-invisible'"
          theme="twoTone"
          :twoToneColor="getRealRecord(record).show?'#95de64':'#ff7875'"
          style="cursor: pointer;"
          @click="onInputShow(record)"
        />
      </template>
      <template slot="fixed" slot-scope="text,record">
        <a-radio-group v-model="getRealRecord(record).fixed" size="small">
          <a-radio-button value="left">
            <a-icon type="pic-left" />
          </a-radio-button>
          <a-radio-button value>
            <a-icon type="pic-center" />
          </a-radio-button>
          <a-radio-button value="right">
            <a-icon type="pic-right" />
          </a-radio-button>
        </a-radio-group>
      </template>
      <template slot="align" slot-scope="text,record">
        <a-radio-group v-model="getRealRecord(record).align" size="small">
          <a-radio-button value="left">
            <a-icon type="align-left" />
          </a-radio-button>
          <a-radio-button value="center">
            <a-icon type="align-center" />
          </a-radio-button>
          <a-radio-button value="right">
            <a-icon type="align-right" />
          </a-radio-button>
        </a-radio-group>
      </template>
      <template slot="sorted" slot-scope="text,record,index" v-if="!record.level||record.level==1">
        <a href="javascript:;" @click="onUpColumn(index)">
          <a-icon type="arrow-up" />
        </a>
        &nbsp;
        &nbsp;
        <a href="javascript:;" @click="onDownColumn(index)">
          <a-icon type="arrow-down" />
        </a>
      </template>
    </a-table>
    <div class="ant-drawer-body-footer">
      <a-button type="default" @click="() => $emit('input', false)">
        <span>Cancel</span>
      </a-button>
      <a-button type="primary" @click="onSubmit">
        <span>Submit</span>
      </a-button>
    </div>
  </a-drawer>
</template>
<script>
import _ from 'lodash'

export default {
  name: 'columnsDrawer',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    columns: {
      type: Array,
      default: () => []
    },
    columnManager: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentColumns: [
        {
          title: '名称',
          dataIndex: 'title',
          // scopedSlots: { customRender: 'name' },
          width: 200
        },
        {
          title: '宽度（80-500）',
          dataIndex: 'width',
          scopedSlots: { customRender: 'width' },
          width: 120
        },
        {
          title: '是否隐藏',
          dataIndex: 'show',
          align: 'center',
          scopedSlots: { customRender: 'show' },
          width: 100
        },
        {
          title: '是否固定',
          dataIndex: 'fixed',
          align: 'center',
          scopedSlots: { customRender: 'fixed' },
          width: 100
        },
        {
          title: '内容的对齐方式',
          dataIndex: 'align',
          align: 'center',
          scopedSlots: { customRender: 'align' },
          width: 120
        },
        {
          title: '排序',
          dataIndex: 'sorted',
          align: 'center',
          scopedSlots: { customRender: 'sorted' },
          width: 100
        }
      ],
      currentDatas: [],
      currentDataList: []
    }
  },
  computed: {
    scroll() {
      return {
        x: this.currentColumns.reduce((sum, column) => {
          return sum + column.width
        }, 0)
      }
    }
  },
  watch: {
    value(value) {
      if (value) {
        this.currentDatas = _.cloneDeep(this.columns)
        this.currentDataList = this.columnManager.columnList(this.currentDatas)
      } else {
        this.currentDatas = []
        this.currentDataList = []
      }
    }
  },
  methods: {
    getRealRecord(record) {
      const realRecord = this.currentDataList.find(data => data.dataIndex == record.dataIndex)
      return realRecord ? realRecord : {}
    },
    onInputShow(record) {
      const realRecord = this.getRealRecord(record)
      realRecord.show = !realRecord.show
    },
    onUpColumn(index) {
      if (index > 0) {
        const cloneColumns = [...this.currentDatas]

        cloneColumns[index - 1] = this.currentDatas[index]
        cloneColumns[index] = this.currentDatas[index - 1]
        this.currentDatas = cloneColumns
        this.currentDataList = treeToArray(this.currentDatas, 'dataIndex', 'parentDateIndex')
      }
    },
    onDownColumn(index) {
      if (index < this.currentDatas.length - 1) {
        const cloneColumns = [...this.currentDatas]

        cloneColumns[index + 1] = this.currentDatas[index]
        cloneColumns[index] = this.currentDatas[index + 1]
        this.currentDatas = cloneColumns
        this.currentDataList = treeToArray(this.currentDatas, 'dataIndex', 'parentDateIndex')
      }
    },
    onSubmit() {
      this.$emit('updateColumns', this.currentDatas)
      this.$emit('input', false)
    }
  }
}
</script>
