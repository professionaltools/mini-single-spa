import { getAppChanges } from "../applications/apps.js"
import { NOT_LOADED, NOT_BOOTSTRAPPED, LOADING_SOURCE_CODE, NOT_MOUNTED, MOUNTED, UNMOUNTING, BOOTSTRAPPING, shouldBeActive } from "../applications/app.helpers.js"
import { started } from "../start.js"
import './navigation-events.js'
function flattenFnArray (fns) {
  fns = Array.isArray(fns) ? fns : [fns]
  return function (customProps) { // promise 将多个promise组合成一个promise链
    return fns.reduce((resultPromise, fn) => {
      return resultPromise.then(() => fn(customProps))
    }, Promise.resolve())
  }
}
function toLoadPromise (app) {
  return Promise.resolve().then(() => {
    // 获取应用的钩子方法
    if (app.loadPromise) {
      return app.loadPromise
    }
    if (app.status !== NOT_LOADED) { // 只有当app的状态是 NOT_LOADED的时候才需要加载
      return app
    }
    app.status = LOADING_SOURCE_CODE
    return (
      app.loadPromise = Promise.resolve().then(() => {
        return app.loadApp().then(val => {
          let { bootstrap, mount, unmount } = val // 获取应用的接入协议,子应用暴露的方法
          app.status = NOT_BOOTSTRAPPED
          app.bootstrap = flattenFnArray(bootstrap)
          app.mount = flattenFnArray(mount)
          app.unmount = flattenFnArray(unmount)
          delete app.loadPromise
          return app
        })
      })
    )
  })
}
function toUnmountPromise (app) {
  return Promise.resolve().then(() => {
    if (app.status !== MOUNTED) { // 如果不是挂载状态 直接跳出
      return app
    }
    app.status = UNMOUNTING // 标记正在卸载 调用卸载方法，成功之后标记为未挂载状态
    return app.unmount(app.customProps).then(() => {
      app.status = NOT_MOUNTED
    })
  })
}
function toBootstrapPromise (app) { // 启动方法
  return Promise.resolve().then(() => {
    if (app.status !== NOT_BOOTSTRAPPED) {
      return app
    }
    app.status = BOOTSTRAPPING // 将状态改为正在启动
    return app.bootstrap(app.customProps).then(() => {
      app.status = NOT_MOUNTED // 将状态改为没有挂载状态
      return app
    })
  })
}
function toMountPromise (app) { // 挂载方法
  return Promise.resolve().then(() => {
    if (app.status !== NOT_MOUNTED) {
      return app
    }
    return app.mount(app.customProps).then(() => {
      app.status = MOUNTED
      return app
    })
  })
}
function tryToBootstrapAndMount (app, unmountPromises) {
  if (shouldBeActive(app)) {
    return toBootstrapPromise(app).then((app) => {
      return unmountPromises.then(() => {
        // 卸载完毕后 执行用户定义的hashchange事件
        return toMountPromise(app)
      })
    })
  } else {
    return unmountPromises.then(() => app)
  }
}
export function reroute () {
  // reroute中 需要知道 我要挂载哪个应该，要卸载哪个应用
  // 根据当前所有应用，过滤出不同的应用类型
  const {
    appsToUnload,
    appsToUnmount,
    appsToLoad,
    appsToMount,
  } = getAppChanges()
  // 需要去加载应用，预先加载
  console.log(
    appsToUnmount,
    appsToLoad,
    appsToMount,
  )
  if (started) { // 如果启动了
    return performAppChanges()
  } else {
    // 需要加载的apps
    return loadApps() // 应用加载 就是把应用的钩子拿到
  }

  function loadApps () {
    const loadPromises = appsToLoad.map(toLoadPromise)
    return Promise.all(loadPromises)
  }
  // 需要调用bootstrap mount和unmount
  function performAppChanges () {
    // 应用启动了 卸载不需要的 挂载需要的
    // ?应用可能没有加载过，如果没有加载 还是需要加载，然后再去启动并挂载
    // 卸载应用 可以边卸载边启动
    let unmountPromises = Promise.all(appsToUnmount.map(toUnmountPromise))

    //应用加载,注意 如果start方法延迟执行的话，可能所有的app都已经加载完了，也就是appsToLoad为空
    appsToLoad.map(app => {
      return toLoadPromise(app).then(app => {
        return tryToBootstrapAndMount(app, unmountPromises) // 需要确保应用线卸载完成之后，再进行挂载
      })
    })
    // 有可能start延迟执行，此时的loadApp已经执行了，此时需要直接挂载就可以了
    appsToMount.map(app => {
      return tryToBootstrapAndMount(app, unmountPromises) // 需要确保应用线卸载完成之后，再进行挂载
    })
  }
}