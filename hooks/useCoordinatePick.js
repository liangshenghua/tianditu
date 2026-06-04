import { ref, unref } from '../lib/dist/vue.esm-browser.prod.js'

// 坐标拾取 hook，支持 activate / deactivate 动态开关
// 1. 鼠标移动实时显示经纬度
// 2. 点击地图拾取坐标并打点标记
// 3. 输入经纬度搜索定位
function useCoordinatePick (map) {
  const pointerCoord = ref(null)
  const pickedCoord = ref(null)
  let markerLayer = null
  let pointerMoveKey = null
  let clickKey = null
  let active = false

  function ensureMarkerLayer () {
    const m = unref(map)
    if (!m || markerLayer) return
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
    markerLayer.setZIndex(999)
    m.addLayer(markerLayer)
  }

  function activate () {
    if (active) return
    active = true
    const m = unref(map)
    if (!m) return

    ensureMarkerLayer()

    pointerMoveKey = m.on('pointermove', function (e) {
      const coord = m.getEventCoordinate(e.originalEvent)
      pointerCoord.value = [coord[0].toFixed(6), coord[1].toFixed(6)]
    })

    clickKey = m.on('click', function (e) {
      console.log('经纬度点击', e)
      pickedCoord.value = [e.coordinate[0].toFixed(6), e.coordinate[1].toFixed(6)]
      markerLayer.getSource().clear()
      markerLayer.getSource().addFeature(new ol.Feature({
        geometry: new ol.geom.Point(e.coordinate),
      }))
    })
  }

  function deactivate () {
    console.log(active)
    if (!active) return
    active = false
    const m = unref(map)
    if (m) {
      if (pointerMoveKey != null) ol.Observable.unByKey(pointerMoveKey)
      if (clickKey != null) ol.Observable.unByKey(clickKey)
    }
    markerLayer.getSource().clear()
    pointerMoveKey = null
    clickKey = null
    pointerCoord.value = null
  }

  function searchCoordinate (lon, lat) {
    const lng = Number(lon)
    const lat_ = Number(lat)
    if (isNaN(lng) || isNaN(lat_)) return

    const m = unref(map)
    if (!m) return

    const coord = [lng, lat_]
    pickedCoord.value = [lng.toFixed(6), lat_.toFixed(6)]

    ensureMarkerLayer()
    markerLayer.getSource().clear()
    markerLayer.getSource().addFeature(new ol.Feature({
      geometry: new ol.geom.Point(coord),
    }))
    m.getView().animate({ center: coord, zoom: 14, duration: 600 })
  }

  return { pointerCoord, pickedCoord, searchCoordinate, activate, deactivate }
}

export { useCoordinatePick }


