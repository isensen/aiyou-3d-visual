import Vue from 'vue'

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

// new Vue({
//   el: '#app',
//   router,
//   store,
//   // template: '<App/>',
//   // components: { App }
//   render: h => h(App)
// })


let instance = null
function render(props = {}) {
  let {container} = props
  instance = new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount(container ? container.querySelector('#app'): '#app') // ! 还是挂载到自己的html中，基座会拿到这个挂载后的html，将其插入进去
  // }).$mount(container ? container.querySelector('#app'): '#app') // ! 还是挂载到自己的html中，基座会拿到这个挂载后的html，将其插入进去
}

if (window.__POWERED_BY_QIANKUN__) {
  //!修改webpack中的publicPath运行时路径
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}

// !如果乾坤不存在，那么就代表这个项目是独立运行的
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// 子组件的协议就设置好了
export async function bootstrap(props) { }
export async function mount(props) { 
  console.log('qiankun-vue', props)
  render(props)
}
export async function unmount(props) {
  instance.$destroy();
  instance.$el.innerHTML = '';
  instance = null;
  router = null;
}