import { createApp, ref } from '/lib/dist/vue.esm-browser.prod.js'
import { useMap } from '/hooks/useMap.js'
import { useGeoJsonLayer } from '/hooks/useGeoJsonLayer.js'
import { useTiandituLayer } from '/hooks/useTiandituLayer.js'
import { useLayer } from '/hooks/useLayer.js'
import { useCoordinatePick } from '/hooks/useCoordinatePick.js'

createApp({
  setup () {
    const { vecLayer, cvaLayer } = useTiandituLayer('')
    // 初始只加载矢量底图，注记图层按需添加
    const map = useMap('map', { center: [113.12, 23.02], zoom: 10, layers: [vecLayer] })

    const { addLayer, removeLayerById, removeLayerByLayer } = useLayer(map)
    const { loadGeoJson } = useGeoJsonLayer(map)
    const { pointerCoord, pickedCoord, searchCoordinate } = useCoordinatePick(map)

    const lonInput = ref('113.12')
    const latInput = ref('23.02')

    function doSearchCoordinate () {
      searchCoordinate(lonInput.value, latInput.value)
    }

    // 增加注记图层
    function addCvaLayer () {
      addLayer(cvaLayer)
    }

    function removeCvaLayer () {
      removeLayerByLayer(cvaLayer)
    }
    function removeCvaLayerById (id) {
      removeLayerById(id)
    }
    // 加载佛山 GeoJSON 行政区划
    function addFoShanGeojson () {
      loadGeoJson(
        '/static/foshan.geojson',
        new ol.style.Style({
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.0)'
          }),
          stroke: new ol.style.Stroke({
            color: '#319FD3',
            width: 3
          }),
          image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({ color: '#FF0000' })
          })
        }),
        // 数据加载完成后自适应缩放至数据范围
        function (source) {
          const extent = source.getExtent()
          if (extent && !isNaN(extent[0])) {
            map.value.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 1000
            })
          }
        }
      )
    }
    return { addCvaLayer, removeCvaLayer, removeCvaLayerById, addFoShanGeojson, doSearchCoordinate, lonInput, latInput, pointerCoord, pickedCoord }
  }
}).mount('#app')
