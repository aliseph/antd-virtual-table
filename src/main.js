import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import VueDraggableResizable from 'vue-draggable-resizable'
Vue.component('vue-draggable-resizable', VueDraggableResizable)
Vue.config.productionTip = false

Vue.use(Antd)

new Vue({
  render: (h) => h(App),
}).$mount('#app')
