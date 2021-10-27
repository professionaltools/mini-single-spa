import {
  isActive,
  shouldBeActive,
  NOT_LOADED,
  NOT_BOOTSTRAPPED,
  NOT_MOUNTED,
  MOUNTED,
  LOAD_ERROR,
  SKIP_BECAUSE_BROKEN,
  LOADING_SOURCE_CODE,
} from "./app.helpers.js"
import { reroute } from "../navigation/reroute.js"
const apps = [] // 这里存放所有的应用
export function getAppChanges () {
  const appsToUnload = [], // 需要完全卸载的列表
    appsToUnmount = [], // 需要移除的列表
    appsToLoad = [], // 需要加载的列表
    appsToMount = []; // 需要挂载的列表
  apps.forEach((app) => {
    const appShouldBeActive = shouldBeActive(app)
    switch (app.status) {
      case NOT_LOADED:
      case LOADING_SOURCE_CODE:
        if (appShouldBeActive) {
          appsToLoad.push(app) // 没有被加载，就是要去加载的app，如果正在加载资源，说明也没有加载过
        }
        break
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        if (appShouldBeActive) {
          appsToMount.push(app) // 没启动过，并且没挂载过，说明等会要挂载
        }
        break
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app) // 正在挂载中，但是路径不匹配了，就需要卸载
        }
        break
    }
  })
  return {
    appsToLoad,
    appsToMount,
    appsToUnload,
    appsToUnmount
  }
}
/**
 * 注册应用 实现应用的加载
 * @param {*} appName 应用名称
 * @param {*} loadApp 应用的加载函数 此函数会返回bootstrap mount unmount
 * @param {*} activeWhen 当前什么时候激活
 * @param {*} customProps 用户自定义参数
 */
function sanitizeArguments (
  appNameOrConfig,
  appOrLoadApp,
  activeWhen,
  customProps
) {
  const usingObjectAPI = typeof appNameOrConfig === "object";
  const registration = {
    name: usingObjectAPI ? appNameOrConfig.name : appNameOrConfig,
    loadApp: usingObjectAPI ? appNameOrConfig.app : appOrLoadApp,
    activeWhen: usingObjectAPI ? appNameOrConfig.activeWhen : activeWhen,
    customProps: usingObjectAPI ? appNameOrConfig.customProps : customProps,
  }
  return registration
}
export function registerApplication (
  appNameOrConfig,
  appOrLoadApp,
  activeWhen,
  customProps
) {
  const registration = sanitizeArguments(
    appNameOrConfig,
    appOrLoadApp,
    activeWhen,
    customProps
  )
  // 保存到数组中，后续可以在数组中筛选需要的app是加载还是卸载还是挂载
  apps.push({
    status: NOT_LOADED,
    loadErrorTime: null,
    parcels: {},
    devtools: {
      overlays: {
        options: {},
        selectors: [],
      },
    },
    ...registration,
  })
  // 注册完毕后 需要进行应用的加载
  reroute() // 重写路径，后续切换路由，需要在做这些事 这是single-spa的核心
}