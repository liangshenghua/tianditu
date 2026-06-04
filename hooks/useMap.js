import { shallowRef, onMounted, onUnmounted } from '../lib/dist/vue.esm-browser.prod.js'

// 地图初始化 hook，组件挂载后创建 ol.Map 实例，卸载时解绑 DOM
function useMap (target, options) {
  const map = shallowRef(null)
  onMounted(() => {
    map.value = new ol.Map({
      target,
      layers: options.layers ?? [],
      view: new ol.View({
        projection: 'EPSG:4326',
        center: options.center ?? [113.12, 23.02],
        zoom: options.zoom ?? 10,
        maxZoom: options.maxZoom ?? 18,
        minZoom: options.minZoom ?? 8,
        constrainResolution: true, // 限制缩放只能停在整数级别，避免瓦片模糊或拼接错位
        smoothResolutionConstraint: false, // 关闭平滑过渡，直接跳到整数级别，保证天地图瓦片清晰对齐
        ...options.view,
      }),
    })
  })
  onUnmounted(() => {
    // 解绑 DOM 节点，避免内存泄漏
    map.value?.setTarget(null)
  })
  return map
}

export { useMap }
