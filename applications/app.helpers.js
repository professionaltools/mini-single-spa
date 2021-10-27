// app statuses
export const NOT_LOADED = "NOT_LOADED"; // 应用默认状态，没有加载过
export const LOADING_SOURCE_CODE = "LOADING_SOURCE_CODE"; // 正在加载文件资源 
export const NOT_BOOTSTRAPPED = "NOT_BOOTSTRAPPED"; // 此时没有调用bootstrap 没有启动过
export const BOOTSTRAPPING = "BOOTSTRAPPING"; // 正在启动 此时bootstrap调用完毕后
export const NOT_MOUNTED = "NOT_MOUNTED"; // 此时没有调用mount没有挂载，需要进行调用mount方法
export const MOUNTING = "MOUNTING"; //挂载中
export const MOUNTED = "MOUNTED"; // 挂载完成
export const UPDATING = "UPDATING"; // 更新中
export const UNMOUNTING = "UNMOUNTING"; // 卸载，回到NOT_MOUNTED状态
export const UNLOADING = "UNLOADING"; // 完全卸载 回到NOT_LOADED状态
export const LOAD_ERROR = "LOAD_ERROR"; // 资源加载失败
export const SKIP_BECAUSE_BROKEN = "SKIP_BECAUSE_BROKEN"; // 代码出错

// 当前应用是否被挂载了，状态是不是mounted
export function isActive (app) {
  return app.status === MOUNTED
}
// 当前应用是否需要去挂载( 路径匹配到应用才会被加载)
export function shouldBeActive (app) { // 如果返回的是true，就要进行挂载
  return app.activeWhen(window.location)
}