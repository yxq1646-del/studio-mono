import { onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * 滚动触发入场动画的组合式函数
 * @param {Function} callback — 接收每个 el 和 index 的回调，用于自定义动画
 * @param {object} options — 选择器和 ScrollTrigger 配置
 */
export function useScrollAnim(callback, options = {}) {
  const { selector, start = 'top 88%', once = true } = options
  let triggers = []

  onMounted(() => {
    const elements = document.querySelectorAll(selector)
    elements.forEach((el, i) => {
      const st = ScrollTrigger.create({
        trigger: el,
        start,
        once,
        onEnter: () => callback(el, i),
      })
      triggers.push(st)
    })
  })

  onUnmounted(() => {
    triggers.forEach((st) => st.kill())
  })
}

export { gsap, ScrollTrigger }
