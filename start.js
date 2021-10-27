import { reroute } from './navigation/reroute.js'
export let started = false
/**
 * 启动应用和执行用户的钩子
 */
export function start () {
  started = true // 开始启动了
  reroute()
}
