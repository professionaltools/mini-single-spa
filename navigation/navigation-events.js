import { reroute } from "./reroute.js"
function urlRoute () {
  setTimeout(() => {
    reroute()
    console.log('urlRoute', window.location.pathname)
  })
}
// 浏览器兼容问题，如果不支持要回退hash，在reroute方法中要实现批处理,因为 hashchange和 popstate都会触发
// window.addEventListener("hashchange", urlRoute)
window.addEventListener("popstate", urlRoute)

// 路由监听事件
const routerEventsListeningTo = ['hashchange', 'popstate']

// 子应用也可能有路由系统，我们需要先加载父应用的事件，再调用子应用
// 需要先加载父应用，再加载子应用
const capturedEventsListeners = {
  hashchange: [],
  popstate: [],
}


const originAddEventListener = window.addEventListener
const originRemoveEventListener = window.removeEventListener

// 重写 addEventListener方法
window.addEventListener = function (eventName, fn) {
  // console.log('eventName', eventName)
  if (
    routerEventsListeningTo.includes(eventName) &&
    !capturedEventsListeners[eventName].some(item => item === fn)
  ) {
    return capturedEventsListeners[eventName].push(fn)
  }
  return originAddEventListener.apply(this, arguments)
}
window.removeEventListener = function (eventName, fn) {
  if (routerEventsListeningTo.includes(eventName)) {
    return capturedEventsListeners[eventName] = capturedEventsListeners[eventName].filter(item => item !== fn)
  }
  return originRemoveEventListener.apply(this, arguments)
}

// 如果使用history.pushState,可以实现页面跳转,但是不会触发popstate

history.pushState = function () {
  window.dispatchEvent(new PopStateEvent('popstate'))
}