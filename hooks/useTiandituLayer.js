import { shallowRef, onMounted, onUnmounted } from '../lib/dist/vue.esm-browser.prod.js'

// 封装天地图专有的图层创建逻辑
// 天地图 WMTS 服务，TILEMATRIXSET=c 对应 EPSG:4326 经纬度投影
function useTiandituLayer (key) {
  // 矢量底图
  const vecLayer = new ol.layer.Tile({
    id: 'vecLayer',
    title: '矢量底图',
    source: new ol.source.XYZ({
      url: `https://t{0-7}.tianditu.gov.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk=${key}`,
      projection: 'EPSG:4326',
    }),
  })

  // 矢量注记（地名、路名等标注）
  const cvaLayer = new ol.layer.Tile({
    id: 'cvaLayer',
    title: '矢量注记',
    source: new ol.source.XYZ({
      url: `https://t1.tianditu.gov.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`,
      projection: 'EPSG:4326',
    }),
  })

  return { vecLayer, cvaLayer }
}

export { useTiandituLayer }
