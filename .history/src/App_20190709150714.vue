<template>
  <a-card :bordered="false" id="app">
    <a-radio-group v-model="multiHeaders" @change="onChangeMulti">
      <a-radio-button value="0">单表头</a-radio-button>
      <a-radio-button value="1">多表头</a-radio-button>
    </a-radio-group>
    <span>
      &nbsp;&nbsp;列数：
      <a-input-number :min="1" :max="10" v-model="columnLength" @change="onChange" />
    </span>
    <span v-if="multiHeaders==0">
      &nbsp;&nbsp;行数：
      <a-input-number :min="1" :max="10" v-model="rowLength" @change="onChange" />
    </span>
    <div style="width: 900px;height:600px;margin: 20px auto;">
      <vue-virtual-table :columns="columns" :rows="rows" :loading="loading">
        <template slot="gender" slot-scope="text">
          <a href="javascript:;">{{text}}</a>
        </template>
      </vue-virtual-table>
      <!-- <a-table
        :columns="columns"
        :dataSource="data"
        bordered
        size="middle"
        :scroll="{ x: '130%', y: 240 }"
      />-->
    </div>
  </a-card>
</template>

<script>
import VueVirtualTable from "@/components/virtualTable/index.jsx";

const data = [];
for (let i = 0; i < 100; i++) {
  data.push({
    key: i,
    name: 'John Brown',
    age: i + 1,
    street: 'Lake Park',
    building: 'C',
    number: 2035,
    companyAddress: 'Lake Street 42',
    companyName: 'SoftLake Co',
    gender: 'M',
  });
}



export default {
  name: "app",
  data: () => ({
    multiHeaders: '0',
    columns: [],
    loading: false,
    rows: [],
    multiColumns: [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: 100,
        fixed: 'left',
        show: true,
        filters: [{
          text: 'Joe',
          value: 'Joe',
        }, {
          text: 'John',
          value: 'John',
        }],
        onFilter: (value, record) => record.name.indexOf(value) === 0,
      },
      {
        title: 'Other',
        dataIndex: 'other',
        show: true,
        width: 400,
        children: [
          {
            title: 'Age',
            dataIndex: 'age',
            key: 'age',
            width: 100,
            sorter: (a, b) => a.age - b.age,
            show: true,
          },
          {
            title: 'Address',
            dataIndex: 'address',
            show: true,
            width: 300,
            children: [
              {
                title: 'Street',
                dataIndex: 'street',
                key: 'street',
                width: 100,
                show: true,
              },
              {
                title: 'Block',
                dataIndex: 'block',
                show: true,
                width: 200,
                children: [
                  {
                    title: 'Building',
                    dataIndex: 'building',
                    key: 'building',
                    width: 100,
                    show: true,
                  },
                  {
                    title: 'Door No.',
                    dataIndex: 'number',
                    key: 'number',
                    width: 100,
                    show: true,
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        title: 'Company',
        dataIndex: 'company',
        show: true,
        width: 200,
        children: [
          {
            title: 'Company Address',
            dataIndex: 'companyAddress',
            key: 'companyAddress',
            align: 'center',
            show: true,
            width: 100,
          },
          {
            title: 'Company Name',
            dataIndex: 'companyName',
            key: 'companyName',
            show: true,
            width: 100,
          }
        ],
      },
      {
        title: 'Gender',
        dataIndex: 'gender',
        key: 'gender',
        width: 80,
        scopedSlots: { customRender: 'gender' },
        show: true,
      },
    ],
    columnLength: 100,
    rowLength: 100
  }),
  components: {
    VueVirtualTable
  },
  mounted() {
    this.genData();
  },
  methods: {
    onChangeMulti() {
      this.loading = true
      this.rows = []
      this.columns = []
      this.onChange()
    },
    onChange() {
      if (this.multiHeaders == 0) {
        this.genData()
      } else {
        this.genMultiData()
      }
    },
    genMultiData() {
      this.columns = this.multiColumns
      const rows = [];
      for (let i = 0; i < this.rowLength; i++) {
        rows.push({
          key: i,
          name: 'John Brown',
          age: i + 1,
          street: 'Lake Park',
          building: 'C',
          number: 2035,
          companyAddress: 'Lake Street 42',
          companyName: 'SoftLake Co',
          gender: 'M',
        });
      }
      this.rows = rows
      this.loading = false
    },
    genData() {
      console.log('normal');
      const columns = [
        {
          title: 'AA',
          dataIndex: 'AA',
          align: 'center',
          fixed: 'left',
          width: 100,
          show: true
        },
        {
          title: 'BB',
          dataIndex: 'BB',
          align: 'center',
          fixed: 'right',
          width: 100,
          show: true
        }
      ]
      let width = 0
      for (let i = 0; i < this.columnLength; i++) {
        width = parseInt(Math.random() * 300)
        columns.push({
          title: 'C_' + i,
          dataIndex: 'C_' + i,
          align: 'center',
          width: width < 100 ? 100 : width,
          show: true
        })
      }
      let row = null
      const rows = []
      for (let i = 0; i < this.rowLength; i++) {
        row = { num: i + 1 }
        columns.forEach(column => {
          row[column.dataIndex] = column.dataIndex + i
        })

        rows.push(row)
      }
      this.rows = rows
      this.columns = columns
      this.loading = false
    },
  }
};
</script>

