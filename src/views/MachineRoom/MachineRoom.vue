<template>
  <div class="machine-room">
    <div
      style="
        z-index: 2;
        text-align: center;
        font-size: 16px;
        color: #00ffff;
        top: 4px;
        position: absolute;
        width: 100%;
        background: rgba(255, 0, 0, 0);
      "
    >
      机房3D可视化
    </div>
    <div style="z-index: 1; position: absolute; width: 100%">
      <img
        :src="require('@/assets/picture/line2.png')"
        alt=""
        style="width: 100%; height: 28px"
      />
    </div>

    <div class="btn-group">
      <el-checkbox-group
        v-for="(item, index) in eventBtns"
        v-model="item.content"
        :key="item.label + '-' + index"
        :size="item.size"
        :disabled="item.disabled"
        @change="handleBtnGroupSelect(item)"
      >
        <component :is="item.type" :label="item.label" border></component>
      </el-checkbox-group>
    </div>

    <div id="label" style="visibility: hidden">
      <div style="position: relative">
        <div
          style="
            position: absolute;
            top: -50px;
            left: 20px;
            width: 100px;
            color: #03b5b3;
          "
        ></div>
        <div style="position: absolute; top: -30px; left: 0px">
          <img :src="require('@/assets/picture/青色弹窗.png')" alt="" />
        </div>
      </div>
    </div>
    <div id="label3" style="visibility: hidden">
      <div style="position: relative">
        <div
          style="
            position: absolute;
            top: -120px;
            left: 55px;
            width: 100px;
            color: #ffffff;
          "
        ></div>
        <div style="position: absolute; top: -100px; left: 0px">
          <img :src="require('@/assets/picture/白色弹窗.png')" alt="" />
        </div>
      </div>
    </div>
    <div id="three-app-dom">
      <div
        v-cloak=""
        id="tan"
        style="width: 300px; height: 400px"
        ref="tan"
        :style="{ left: currentMesh.left + 'px', top: currentMesh.top + 'px' }"
        v-show="currentMesh.show"
      >
        <div style="position: relative">
          <el-tabs type="border-card" v-model="currentTab">
            <el-tab-pane
              label="机柜信息"
              name="机柜信息"
              :disabled="!currentCabnet.show"
            >
              <panel-box :dataSet="cabinetMesh"></panel-box>
            </el-tab-pane>
            <el-tab-pane
              label="设备服务器信息"
              name="设备服务器信息"
              :disabled="!currentServerDevice.show"
            >
              <div
                class="panel-container"
                :style="`height: ${430}px;overflow-y: auto; overflow-x: hidden;`"
              >
                <panel-box
                  v-for="(serverDeviceMesh, index) in serverDeviceMeshList"
                  :dataSet="serverDeviceMesh"
                  :height="430"
                  :key="`serverDeviceMesh-${index}`"
                ></panel-box>
              </div>
            </el-tab-pane>
          </el-tabs>

          <!-- <div style="position:absolute;left:155px;top:80px;font-size:60px;color:#00ffff;vertical-align:middle;text-align: center;">
            xx </div>
          <div
            style="position:absolute;left:70px;top:170px;padding:8px 25px;border-radius:30px;border:1px solid #00ffff;">
            xx m</div>
          <div style="position:absolute;left:225px;top:170px;padding:8px 25px;">xx m</div> -->
        </div>
      </div>
    </div>

    <!-- 显示编辑设备的表单 -->
    <el-dialog
      :title="'机柜：' + recordFormData.cabinetName"
      :visible.sync="recordDeviceUbitDialog.showOuterVisible"
    >
      <!-- <el-dialog
        width="30%"
        title="内层 Dialog"
        :visible.sync="innerVisible"
        append-to-body>
      </el-dialog> -->
      <record-form
        :recordFormData="recordFormData"
        @submitRecordForm="handleRecordForm"
      ></record-form>

      <!-- <div slot="footer" class="dialog-footer">
        <el-button @click="recordDeviceUbitDialog.showOuterVisible = false"
          >取 消</el-button
        >
        <el-button
          type="primary"
          @click="recordDeviceUbitDialog.showOuterVisible = false"
          >确定</el-button
        >
      </div> -->
    </el-dialog>

    <!-- 显示搜索设备的弹窗 -->
    <el-drawer
      title="查询模式"
      :visible.sync="drawerSearch"
      :with-header="false"
      :modal="false"
      :size="'300px'"
      :wrapperClosable="false"
    >
      <div class="search-box">
        <single-search-list
          placeholder="请输入机柜ID或者名称"
          :treeList="cabinetSearchList"
          @tree-row-click="handleTreeRowClick"
        ></single-search-list>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { Notification, Message, MessageBox } from "element-ui";

import initThree, { scene, dataSet } from "@//machine/Helper/initThree";
import MachineRoom from "@/machine/MachineRoom/MachineRoom.ts";

import PanelBox from "./components/PanelBox";
import RecordForm from "./components/RecordForm";
import SingleSearchList from "./components/SingleSearchList";
import { getCabinetAndDevice, subCabinetRecordDevice } from "@/api/cabinet3d";
import genarateOps, { genarateCabinet, getHeightByUnum } from "./MachineRoom.conf";
import { genarateMenuList, handleMenuItemAction, dynamicGenarateCabinetConfs, handleCabinetsPosition, dynamicCalcMahineRoomLayoutProportionValue } from './MachineRoom.action'



export default {
  name: "MachineRoom",
  components: {
    "panel-box": PanelBox,
    "record-form": RecordForm,
    "single-search-list": SingleSearchList,
  },
  data() {
    return {
      // 事件菜单的按钮
      eventBtns: [],

      // 机柜列表和设备列表及列
      cabinetColumn: {
        机号: "name",
      },
      cabinetList: [],
      serverDeviceColumn: {},
      serverDeviceList: [],

      // 当前机柜的ID
      machineRoomId: 1,
      // 请求节流的定时器
      timer: undefined,

      // 当前悬浮展示的网格模型的状态及x、y的位置
      currentMesh: {
        show: false,
        left: 0,
        top: 0,
      },

      // 当前机柜、设备的信息框状态
      currentCabnet: {
        show: false,
      },
      currentServerDevice: {
        show: false,
      },

      // 录入空缺U位设备的弹窗状态
      edited: false,
      recordDeviceUbitDialog: {
        showOuterVisible: false,
        cabinetInfo: {},
        serverDeviceInfo: [],
      },
      // 当前激活的tab
      currentTab: "机柜信息",

      // 支持机柜搜索的抽屉状态
      drawerSearch: false,
      cabinetSearchList: [],

      // 编辑机房的操作
      editMachineRoom: false,
    };
  },
  computed: {
    // 机柜的网格模型的数据
    cabinetMesh() {
      const meshData = JSON.parse(JSON.stringify(this.currentCabnet));
      delete meshData.show;

      const cabinetColumn = JSON.parse(JSON.stringify(this.cabinetColumn));
      const keys = Object.keys(cabinetColumn);
      const values = Object.values(cabinetColumn);

      return values.map((key, index) => {
        let result;

        if (index === 0) {
          result = {
            vip: true,
            label: keys[index],
            content: meshData[key],
            style: {},
          };
        } else if (key === "") {
          // TODO: 机柜利用率使用百分比展示，处理JS中的进度丢失问题，保留小数点后两位
          // NOTE: (cabietRate * 100).toFixed(2) + '%'
        } else {
          result = {
            vip: false,
            label: keys[index],
            content: meshData[key],
            style: {},
          };
        }

        return result;
      });
    },

    // 设备服务器的网格模型的数据
    serverDeviceMeshList() {
      const meshData = JSON.parse(JSON.stringify(this.currentServerDevice));
      delete meshData.show;

      const { container = [] } = meshData;

      const serverDeviceColumn = JSON.parse(
        JSON.stringify(this.serverDeviceColumn)
      );
      const keys = Object.keys(serverDeviceColumn);
      const values = Object.values(serverDeviceColumn);

      return container.map((subMeshData) => {
        return values.map((key, index) => {
          let result;

          if (index === 0) {
            result = {
              vip: true,
              label: keys[index],
              content: subMeshData[key],
              style: {},
            };
          } else {
            result = {
              vip: false,
              label: keys[index],
              content: subMeshData[key],
              style: {},
            };
          }

          return result;
        });
      });
    },

    // 记录的表单数据
    recordFormData() {
      /**
       * 需求；
       * 1. 点击机柜，弹出一个表格，展示当前机柜中所有设备的信息，信息包含两种，一种是已存在的设备U位，一种是空缺的U位
       * 2. 已存在的设备U位信息可以修改和删除，空缺的设备U位信息可以点击这一行的新增，也可以点击最外层的大新增
       * 3. 新增信息的表单，包含所有设备信息基础信息的陈设，U位支持选择和手动输入，默认支持手动输入，可以看到哪些U位是可见的。
       *
       * 思路：
       * 1. 设计表单，获取机柜信息，获取机柜下所有的设备信息，计算出还有哪些空缺U位。
       * 2. 设计弹窗，弹窗状态的变更，弹窗支持拖拽
       *
       * 实现：
       * 1. 表单字段信息：设备ID、设备名、设备管理ip、设备状态、设备厂商、设备型号、设备所属数据中心、机架的名称、所属机柜的ID、开始U位、结束U位
       * 2. 弹窗状态：是否可见
       */

      const {
        cabinetInfo,
        serverDeviceInfo: serverDeviceInfoList,
      } = this.recordDeviceUbitDialog;

      // 机柜名称、机柜总U数、机柜利用率、数据中心、机房名称
      // const { cabinetName, cabinetTotalU, cabinetRate,  machineRoomName } = cabinetInfo
      const {
        cabinetID,
        cabinetName,
        cabinetTotalU,
        cabinetRate,
        dataCenterName,
        machineRoomName,
      } = cabinetInfo;

      let uContainer = new Array(cabinetTotalU)
        .fill(1)
        .map(() => ({ isEmpty: true })); // 默认全空

      // 设备取起始和结束的 U位即可
      serverDeviceInfoList.forEach((info) => {
        // const { deviceID, deviceName, deviceIP, deviceState, deviceManufacturer, deviceType, dataCenterName, rankName, cabinetID, startU, endU } = info
        const { startU, endU } = info;
        for (let i = startU; i <= endU; i++) {
          // console.log(i + "-", uContainer[i]);
          uContainer[i].isEmpty = false;
        }
      });

      return {
        cabinetID,
        cabinetName,
        cabinetTotalU,
        cabinetRate,
        dataCenterName,
        machineRoomName,
        uContainer,
      };
    },
  },
  methods: {
    // 初始化
    async init(ops) {
      const vueModel = this;
      // console.log("mounted@vueModel", vueModel);
      // console.log("ops.objects", ops.objects);
      if (__webpack_public_path__ === '/') {

      }
      initThree({
        domID: "three-app-dom",
        dataSet: [],
        eventList: [],
        sourcePath: __webpack_public_path__ === '/' ? undefined : __webpack_public_path__ + '/static/three.js/images/',
        vueModel: vueModel,
        proportionValue: ops.proportionValue,
      });

      window.machineRoom = new MachineRoom(
        {
          cabinetCfgs: [],
          name: "机房2021",
          items: [...ops.objects],
        },
        null
      );

      // console.log('scene', scene)
      // console.log('dataSet', dataSet)
    },

    // 请求机柜及服务器信息
    async requestCabinetAndDevice() {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(async () => {
        const result = await getCabinetAndDevice(this.machineRoomId);
        const { code, data, message } = result;
        const {
          proportionValue,
          transitionValue,
        } = dynamicCalcMahineRoomLayoutProportionValue.call(this, data);
        const ops = genarateOps(proportionValue, transitionValue);

        this.initCabinetSearch(data);
        this.handleRequestTitle(data);
        const refectResult = this.handleRequestList(data, proportionValue);
        ops.objects.push(...refectResult);
        const newOps = {
          ...ops,
          proportionValue,
          transitionValue,
        };
        this.init(newOps);
      }, 500);
    },

    // 初始化机柜查询的信息
    initCabinetSearch(result) {
      const { cabinets, serverDeviceList } = result;
      const list = cabinets.list;
      this.cabinetSearchList = list.reduce((prev, current) => {
        prev.push({
          id: current.cabinetID,
          label: current.cabinetName,
        });

        return prev;
      }, []);
    },

    // 点击树中的每一项
    handleTreeRowClick(data) {
      const { id, label } = data;
      const target = window.machineRoom.cabinets.find((item) => {
        return item.cabinet.userData.cabinetName === label;
      });

      target.threeClickCabinet({
        object: target.cabinet,
      });
      target.hoverCabinet(target.cabinet, {
        pageX: document.body.offsetWidth / 2,
        pageY: document.body.offsetHeight / 3,
      });
    },

    // 处理请求结果中的title，生成动态标题数据
    handleRequestTitle(result) {
      const { cabinets, serverDeviceList } = result;
      const { title: cabinetTitle } = cabinets;
      const { title: serverDeviceTitle } = serverDeviceList;

      const cabinetColumn = cabinetTitle.reduce((prev, item) => {
        prev[item.label] = item.name;
        return prev;
      }, {});

      const serverDeviceColumn = serverDeviceTitle.reduce((prev, item) => {
        prev[item.label] = item.name;
        return prev;
      }, {});

      this.$set(this, "cabinetColumn", {
        机号: "name",
        ...cabinetColumn,
      });
      this.$set(this, "serverDeviceColumn", {
        ...serverDeviceColumn,
      });
    },

    // 处理请求结果中的list，动态生成列表数据
    handleRequestList(result, proportionValue) {
      // console.log("result", result);
      const { cabinets, serverDeviceList } = result;
      const data = [];
      cabinets.list.forEach((item) => {
        const {
          cabinetID: cID,
          cabinetRate,
          cabinetTotalU,
          uBitLength,
          cabinetName,
          dataCenterName,
          machineRoomName,
        } = item;
        const obj = {
          cabinetID: cID,
          cabinetRate,
          cabinetTotalU,
          uBitLength,
          cabinetName,
          dataCenterName,
          machineRoomName,
          children: [],
        };
        data.push(obj);
        serverDeviceList.list.forEach((deviceItem) => {
          const {
            cabinetID,
            deviceID,
            deviceName,
            deviceIP,
            deviceState,
            deviceManufacturer,
            deviceType,
            dataCenterName,
            rankName,
            startU,
            endU,
          } = deviceItem;

          if (cabinetID === cID) {
            const temp = {
              cabinetID,
              deviceID,
              deviceName,
              deviceIP,
              deviceState,
              deviceManufacturer,
              deviceType,
              dataCenterName,
              rankName,
              startU,
              endU,
            };
            obj.children.push(temp);
          }
        });
      });

      let refectResult = this.refactCabinet(data, proportionValue);

      refectResult = this.sortCabinet(refectResult, proportionValue);

      return refectResult;
    },

    // 动态生成绘制机柜的配置数据
    refactCabinet(data, proportionValue) {
      const cabinets = dynamicGenarateCabinetConfs.call(this, data, proportionValue)
      return cabinets;
    },

    // 对机柜的数据进行排序，防止重叠在一起
    sortCabinet(data, proportionValue) {
      const cabinets = handleCabinetsPosition.call(this, data, proportionValue)
      return cabinets;
    },

    // 初始化右上角的菜单
    initMenu() {
      this.eventBtns = genarateMenuList.call(this, void 0);
    },

    // 处理右上角菜单的点击事件
    handleBtnGroupSelect(item) {
      handleMenuItemAction.call(this, item)
    },

    // 处理机柜的设备数据录入
    async handleRecordForm(data) {
      const result = await subCabinetRecordDevice({
        machineRoomId: this.machineRoomId,
        ...data,
      });

      const { code, message, data: param } = result;
      if (code !== 200) {
        return Message({
          showClose: true,
          message: message,
          type: "error",
          duration: 5 * 1000,
        });
      } else {
        // console.log("data：", param);
        let info = "";
        const keys = Object.keys(param);
        Object.values(param).forEach((item, index) => {
          info += keys[index];
          info += "：";
          info += item;
          info += "\r\n";
        });
        alert(info);
        this.recordDeviceUbitDialog.showOuterVisible = false;
        // window.location.reload();
        // await this.requestCabinetAndDevice();
      }
    },
  },
  watch: {},
  mounted() {
    this.initMenu();
  },

  async created() {
    await this.requestCabinetAndDevice();
  },

  destroyed () {
    scene.children.forEach(item => {
      dispose(item)
    })

    window.location.reload(true)

    function dispose(mesh) {
      if (mesh.children.length) {
        mesh.children.forEach(subMesh => dispose(subMesh))
      }

      if (mesh.geometry && mesh.geometry.dispose) {
        mesh.geometry.dispose()
      }

      if (mesh.material && mesh.material.dispose) {
        mesh.material.dispose()
      }
      
      
      mesh = null
    }
  }
};
</script>

<style lang="scss" scoped>
body {
  margin: 0;
  overflow: hidden;
  background: rgb(1, 3, 28);
}

.machine-room {
  width: 100%;
  height: 100vh;//100%;

  .el-drawer__wrapper {
    left: calc(100% - 300px);
  }

  .btn-group {
    position: fixed;
    right: 0px;
    top: 25px;
    width: 705px;
    text-align: left;
    .el-checkbox-group {
      display: inline-block;
      height: 35px;
      margin: 0px 3px;
      width: 110px;
      .el-checkbox {
        width: 100%;
        color: #b1dcff;
      }
    }
  }

  .search-box {
    padding: 10px;
  }
}

#three-app-dom {
  width: 100%;
  height: 100%;
}

#tan {
  position: absolute;
  color: #fff;
  z-index: 102;
  font-size: 16px;
}

#tan0 {
  position: absolute;
  color: #fff;
  background: rgba(2, 4, 27, 0.8);
  padding: 20px;
  border-radius: 5px;
  border: 1px solid #00aeef;
  z-index: 102;
  width: 180px;
  font-size: 16px;
}

#tan0 > div {
  padding: 5px;
}

#left {
  position: absolute;
  z-index: 200;
  width: 150px;
  background: rgba(255, 255, 255, 1);
  padding: 15px;
  height: 100%;
}

// ::-webkit-scrollbar {
//     width: 6px;
//     height: 6px;
//   }
//   ::-webkit-scrollbar-track {
//     width: 6px;
//     background: rgba(#101f1c, 0.1);
//     -webkit-border-radius: 2em;
//     -moz-border-radius: 2em;
//     border-radius: 2em;
//   }
//   ::-webkit-scrollbar-thumb {
//     background-color: rgba(#101f1c, 0.5);
//     background-clip: padding-box;
//     min-height: 28px;
//     -webkit-border-radius: 2em;
//     -moz-border-radius: 2em;
//     border-radius: 2em;
//   }
//   ::-webkit-scrollbar-thumb:hover {
//     background-color: rgba(#101f1c, 1);
//   }

[v-cloak] {
  display: none;
}
</style>
