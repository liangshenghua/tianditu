import { unref } from '../lib/dist/vue.esm-browser.prod.js'

// GeoJSON 加载 hook，从 URL 读取并添加矢量图层到地图
function useGeoJsonLayer (map) {
  function loadGeoJson (url, style, onLoadend) {
    const layer = new ol.layer.Vector({
      source: new ol.source.Vector({
        url,
        format: new ol.format.GeoJSON(),
      }),
      style,
    })
    unref(map)?.addLayer(layer)

    // featuresloadend 在异步加载完成后触发
    if (onLoadend) {
      const source = layer.getSource()
      source.on('featuresloadend', () => onLoadend(source))
    }

    return layer
  }
  return { loadGeoJson }
}

export { useGeoJsonLayer }
