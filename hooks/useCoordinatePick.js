import { ref, onMounted, onUnmounted, unref } from '../lib/dist/vue.esm-browser.prod.js'

// 坐标拾取 hook，提供三种能力：
// 1. 鼠标移动实时显示当前经纬度
// 2. 点击地图拾取坐标并放置标记
// 3. 输入经纬度搜索定位
function useCoordinatePick (map) {
  const pointerCoord = ref(null)
  const pickedCoord = ref(null)
  // 用闭包变量管理事件句柄，避免重复绑定
  let markerLayer = null
  let pointerMoveKey = null
  let clickKey = null

  function init () {
    const m = unref(map)
    if (!m) return

    if (!markerLayer) {
      markerLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 8,
            fill: new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.6)' }),
            stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
          }),
        }),
      })
      // 确保标记点显示在所有图层最上层
      markerLayer.setZIndex(999)
      m.addLayer(markerLayer)
    }

    // 鼠标移动：实时更新当前坐标
    if (pointerMoveKey == null) {
      pointerMoveKey = m.on('pointermove', function (e) {
        const coord = m.getEventCoordinate(e.originalEvent)
        pointerCoord.value = [coord[0].toFixed(6), coord[1].toFixed(6)]
      })
    }

    // 点击地图：拾取坐标并打点标记
    if (clickKey == null) {
      clickKey = m.on('click', function (e) {
        pickedCoord.value = [e.coordinate[0].toFixed(6), e.coordinate[1].toFixed(6)]
        markerLayer.getSource().clear()
        markerLayer.getSource().addFeature(new ol.Feature({
          geometry: new ol.geom.Point(e.coordinate),
        }))
      })
    }
  }

  // 方式一：输入经纬度搜索并定位
  function searchCoordinate (lon, lat) {
    const lng = Number(lon)
    const lat_ = Number(lat)
    if (isNaN(lng) || isNaN(lat_)) return

    const m = unref(map)
    if (!m) return

    const coord = [lng, lat_]
    pickedCoord.value = [lng.toFixed(6), lat_.toFixed(6)]

    if (!markerLayer) {
      init()
    }
    markerLayer.getSource().clear()
    markerLayer.getSource().addFeature(new ol.Feature({
      geometry: new ol.geom.Point(coord),
    }))
    m.getView().animate({ center: coord, zoom: 14, duration: 600 })
  }

  function cleanup () {
    const m = unref(map)
    if (m) {
      if (pointerMoveKey != null) m.un('pointermove', pointerMoveKey)
      if (clickKey != null) m.un('click', clickKey)
      if (markerLayer) m.removeLayer(markerLayer)
    }
    pointerMoveKey = null
    clickKey = null
    markerLayer = null
  }

  onMounted(init)
  onUnmounted(cleanup)

  return { pointerCoord, pickedCoord, searchCoordinate }
}

export { useCoordinatePick }
