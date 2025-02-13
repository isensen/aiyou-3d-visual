import Vue from 'vue'
import singleSpaVue from "single-spa-vue";

// import VCharts from 'v-charts'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import locale from 'element-ui/lib/locale/lang/en' // lang i18n
import '@/assets/css/iconfont/1.0.0/index.css' /* icofont*/

// css
import 'normalize.css/normalize.css'// A modern alternative to CSS resets
import '@/styles/index.scss' // global css
// 右键菜单
// import contentmenu from 'v-contextmenu'
// import 'v-contextmenu/dist/index.css'

/* NOTE: 如果引入mockjs，文件下载时，axios 获取不到blob对象，只能获取blob转换后的字符串 */
import './mock' // simulation data
import './errorLog'// error log
// font-awesome
import '@/assets/library/font-awesome-4.7.0/css/font-awesome.min.css'

import App from './App'

import router from './router'

import store from './store'

import { global } from '@/global/global'
import {
  loadStyle
} from './utils/util'
import {
  iconfontUrl,
  iconfontVersion
} from '@/config/env'

import '@/permission' // permission control

// import * as filters from './filters' // global filters
// // register global utility filters.
// Object.keys(filters).forEach(key => {
//   Vue.filter(key, filters[key])
// })

// Vue.use(VCharts)
// Vue.use(contentmenu)
Vue.use(ElementUI, { locale })
iconfontVersion.forEach(ele => {
  loadStyle(iconfontUrl.replace('$key', ele))
})
Vue.use(ElementUI, {
  size: 'medium' // set element-ui default size
})
// 加载用户主题
if (localStorage.getItem('themeValue')) {
  global.changeTheme(localStorage.getItem('themeValue'))
} else {
  global.changeTheme('default')
}
Vue.config.productionTip = false


const vueOptions = {
  el: "#vue",
  router,
  store,
  render: h => h(App)
};

// 判断当前页面使用singleSpa应用,不是就渲染
if (!window.singleSpaNavigate) {
  delete vueOptions.el;
  new Vue(vueOptions).$mount('#vue');
}

// singleSpaVue包装一个vue微前端服务对象
const vueLifecycles = singleSpaVue({
  Vue,
  appOptions: vueOptions
});

export const bootstrap = vueLifecycles.bootstrap; // 启动时
export const mount = vueLifecycles.mount; // 挂载时
export const unmount = vueLifecycles.unmount; // 卸载时

export default vueLifecycles;