import { ref, unref } from '../lib/dist/vue.esm-browser.prod.js'

const defaultStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.0)' }),
  stroke: new ol.style.Stroke({ color: '#3b82f6', width: 2 }),
})

const hoverStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: 'rgba(0, 200, 80, 0.15)' }),
  stroke: new ol.style.Stroke({ color: '#22c55e', width: 3 }),
})

const selectedStyle = new ol.style.Style({
  fill: new ol.style.Fill({ color: 'rgba(239, 68, 68, 0.2)' }),
  stroke: new ol.style.Stroke({ color: '#ef4444', width: 3 }),
})

function useDistrictLayer (map) {
  const districtLayer = ref(null)
  const tooltip = ref({ show: false, x: 0, y: 0, name: '', code: '' })
  const loaded = ref(false)
  let hovered = null
  let selected = null
  let pointerMoveKey = null
  let clickKey = null
  let layerRef = null

  function addDistrictLayer () {
    const m = unref(map)
    if (!m || loaded.value) return

    const source = new ol.source.Vector({
      url: '/static/佛山市_县.geojson',
      format: new ol.format.GeoJSON({ dataProjection: 'EPSG:4490', featureProjection: 'EPSG:4326' }),
    })

    layerRef = new ol.layer.Vector({
      source,
      style: function (feature) {
        if (feature === selected) return selectedStyle
        if (feature === hovered) return hoverStyle
        return defaultStyle
      },
    })
    layerRef.setZIndex(100)
    m.addLayer(layerRef)
    districtLayer.value = layerRef
    loaded.value = true

    pointerMoveKey = m.on('pointermove', function (e) {
      var f = m.forEachFeatureAtPixel(e.pixel, function (feat) { return feat })
      if (f !== hovered) {
        if (hovered && hovered !== selected) hovered.setStyle(defaultStyle)
        hovered = f
        if (f && f !== selected) f.setStyle(hoverStyle)
        m.getTargetElement().style.cursor = f ? 'pointer' : ''
      }
      if (f) {
        var props = f.getProperties()
        tooltip.value = { show: true, x: e.pixel[0], y: e.pixel[1], name: props.name || '', code: props.gb || '' }
      } else {
        tooltip.value = { show: false, x: 0, y: 0, name: '', code: '' }
      }
    })

    clickKey = m.on('click', function (e) {
      var f = m.forEachFeatureAtPixel(e.pixel, function (feat) { return feat })
      if (selected && selected !== f) selected.setStyle(defaultStyle)
      selected = f
      if (f) f.setStyle(selectedStyle)
    })
  }

  function removeDistrictLayer () {
    var m = unref(map)
    if (m) {
      if (pointerMoveKey) ol.Observable.unByKey(pointerMoveKey)
      if (clickKey) ol.Observable.unByKey(clickKey)
      if (layerRef) m.removeLayer(layerRef)
    }
    hovered = null
    selected = null
    pointerMoveKey = null
    clickKey = null
    layerRef = null
    districtLayer.value = null
    loaded.value = false
    tooltip.value = { show: false, x: 0, y: 0, name: '', code: '' }
  }

  return { districtLayer, tooltip, loaded, addDistrictLayer, removeDistrictLayer }
}

export { useDistrictLayer }
