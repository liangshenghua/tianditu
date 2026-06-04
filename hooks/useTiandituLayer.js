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
  const imageLayer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
      url: 'static/map.jpg', // 你的图片路径
      projection: 'EPSG:4326',  // 地图的坐标系
      // 关键：图片在地图上对应的地理范围 [左下角X, 左下角Y, 右上角X, 右上角Y]
      // imageExtent: [113.12, 23.02, 113.42, 23.42]
    }),
    opacity: 0.8 // 可以设置透明度，以便看清底图
  });

  const Overlay = new ol.Overlay({
    element: document.getElementById('fixed-image'), // 绑定 HTML 元素
    position: [116.40, 39.90],          // 固定的地理坐标
    positioning: 'center-center',                   // 元素的中心点对齐坐标
    stopEvent: false                                // 允许鼠标透过图片拖拽地图
  });

  return { vecLayer, cvaLayer, imageLayer, Overlay }
}

export { useTiandituLayer }
