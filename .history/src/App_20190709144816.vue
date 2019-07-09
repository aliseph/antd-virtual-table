<template>
  <a-card :bordered="false" id="app">
    <div style="width: 900px;height:600px;margin: auto;">
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
const _uuid = () => {
  var d = Date.now()
  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    d += performance.now() //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = ((d + Math.random() * 16) % 16) | 0
    d = Math.floor(d / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const columns = [
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
];

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
    data,
    columns,
    loading: false,
    rows: [],
    tableConfig: [
      { prop: "_index", name: "#", width: 80 },
      {
        prop: "user",
        name: "User",
        searchable: true,
        sortable: true,
        summary: "COUNT",
        width: 600
      },
      {        prop: "age", name: "Age", numberFilter: true,
        width: 200      },
      {        prop: "city", name: "City", filterable: true,
        width: 200      },
      {        prop: "_action", name: "Action", actionName: "actionCommon",
        width: 200      },
      {        prop: "city", name: "City", filterable: true,
        width: 200      },
      {        prop: "city", name: "City", filterable: true,
        width: 200      },
      {        prop: "city", name: "City", filterable: true,
        width: 200      },
      {        prop: "city", name: "City", filterable: true,
        width: 200      },
    ],
    tableData: [
      { user: "a1", age: 20, city: "a" },
      { user: "a2", age: 21, city: "b" },
      { user: "a3", age: 23, city: "a" }
    ],
    tableAttribute: {
      height: 650,
      itemHeight: 42,
      minWidth: 1000,
      selectable: true,
      enableExport: true,
      bordered: true,
      hoverHighlight: true,
      language: "en"
    },
    lineNum: 1000,
    userConfig: {
      prop: "user",
      name: "User",
      searchable: true,
      sortable: true,
      summary: "COUNT",
      alignItems: "center",
      isHidden: false
    },
    ageConfig: {
      prop: "age",
      name: "Age",
      numberFilter: true,
      sortable: false,
      summary: "",
      alignItems: "center",
      isHidden: false
    },
    cityConfig: {
      prop: "city",
      name: "City",
      filterable: true,
      summary: "",
      alignItems: "center",
      isHidden: false
    }
  }),
  components: {
    VueVirtualTable
  },
  mounted() {
    this.genData();
  },
  methods: {
    updateTableConfig(prop, conf) {
      let propIndex = this.tableConfig.findIndex(v => v.prop == prop);
      this.tableConfig.splice(propIndex, 1, conf);
    },
    handleSelectionChange(rows) {
      console.log(rows);
    },
    edit(index, row) {
      console.log(index);
    },
    del(index, row) {
      console.log(index);
    },
    genData() {
      this.randomData(this.lineNum);
      let columns = [
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
      for (let i = 0; i < 10; i++) {
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
      let rows = []
      for (let i = 0; i < 110; i++) {
        row = { num: i + 1 }
        columns.forEach(column => {
          row[column.dataIndex] = column.dataIndex + i
        })

        rows.push(row)
      }
      this.loading = true
      setTimeout(() => {
        this.rows = rows
        this.loading = false
      }, 300);
      this.columns = columns
    },
    randomData(len) {
      let cts = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n"
      ];
      let all_data = [];
      for (let i = 0; i < len; i++) {
        let user = "u" + _uuid(6, 10),
          age = Math.floor((34 - 16) * Math.random()) + 16;
        let cityIndex = Math.floor(cts.length * Math.random());
        let city = cts[cityIndex];
        all_data.push({ user, age, city });
      }
      this.tableData = all_data;
    }
  }
};
</script>

