import { unref } from '../lib/dist/vue.esm-browser.prod.js'

// 图层操作 hook，封装 map 的 addLayer / removeLayer 调用
function useLayer (map) {
  function addLayer (layer) {
    unref(map)?.addLayer(layer)
  }
  // 通过自定义 id 属性查找并移除图层
  function removeLayerById (id) {
    const layers = unref(map)?.getLayers().getArray()
    if (!layers) return
    const target = layers.find(item => item.get('id') === id)
    if (target) unref(map).removeLayer(target)
  }

  function removeLayerByLayer (layer) {
    unref(map)?.removeLayer(layer)
  }

  return { addLayer, removeLayerById, removeLayerByLayer }
}

export { useLayer }
