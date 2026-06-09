import { createApp, ref, unref, onMounted } from '/lib/dist/vue.esm-browser.prod.js'
import { useMap } from '/hooks/useMap.js'
import { useGeoJsonLayer } from '/hooks/useGeoJsonLayer.js'
import { useTiandituLayer } from '/hooks/useTiandituLayer.js'
import { useLayer } from '/hooks/useLayer.js'
import { useCoordinatePick } from '/hooks/useCoordinatePick.js'
import { useDistrictLayer } from '/hooks/useDistrictLayer.js'
import { useDotLayer } from '/hooks/useDotLayer.js'

createApp({
  setup () {
    const { vecLayer, cvaLayer, imageLayer } = useTiandituLayer('94f45de0cf8340f572f4ae41558e145d')
    const map = useMap('map', { center: [113.12, 23.02], zoom: 10, layers: [vecLayer, cvaLayer] })


    const { addLayer, removeLayerById, removeLayerByLayer } = useLayer(map)
    const { loadGeoJson } = useGeoJsonLayer(map)
    const { pointerCoord, pickedCoord, searchCoordinate, activate, deactivate } = useCoordinatePick(map)
    const { tooltip: districtTooltip, loaded: districtLoaded, addDistrictLayer, removeDistrictLayer } = useDistrictLayer(map)
    const { addDotLayer, removeDotLayer, loading: dotLoading, loaded: dotLoaded, popup: dotPopup, _startPulseLoop } = useDotLayer(map)

    // --- 工具菜单 ---
    const showTools = ref(false)
    const coordToolActive = ref(false)
    const lonInput = ref('113.12')
    const latInput = ref('23.02')

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.tools-menu')) showTools.value = false
    })

    function toggleCoordTool () {
      coordToolActive.value = !coordToolActive.value
      if (coordToolActive.value) { activate() } else { deactivate() }
    }

    function doSearchCoordinate () {
      searchCoordinate(lonInput.value, latInput.value)
    }

    // --- 佛山五区图层切换 ---
    function toggleDistrictLayer () {
      if (districtLoaded.value) { removeDistrictLayer() } else { addDistrictLayer() }
    }

    // --- 海量点位图层切换 ---
    function toggleDotLayer () {
      if (dotLoaded.value) { removeDotLayer() } else {
        addDotLayer()
        _startPulseLoop()
      }
    }

    // --- 图层操作 ---
    function addCvaLayer () { addLayer(cvaLayer) }
    function removeCvaLayer () { removeLayerByLayer(cvaLayer) }
    function removeCvaLayerById (id) { removeLayerById(id) }

    function addFoShanGeojson () {
      var foshanLayer = loadGeoJson(
        '/static/foshan.geojson',
        new ol.style.Style({
          fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.0)' }),
          stroke: new ol.style.Stroke({ color: '#319FD3', width: 3 }),
          image: new ol.style.Circle({ radius: 5, fill: new ol.style.Fill({ color: '#FF0000' }) }),
        }),
        function (source) {
          var features = source.getFeatures()
          // 全球范围外环
          var worldRing = [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]
          var holes = []
          for (var i = 0; i < features.length; i++) {
            var geom = features[i].getGeometry()
            if (geom.getType() === 'MultiPolygon') {
              var polys = geom.getPolygons()
              for (var j = 0; j < polys.length; j++) {
                holes.push(polys[j].getCoordinates()[0])
              }
            } else if (geom.getType() === 'Polygon') {
              holes.push(geom.getCoordinates()[0])
            }
          }
          // 创建遮罩：全球范围挖掉佛山
          var maskGeom = new ol.geom.Polygon([worldRing].concat(holes))
          var maskLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: [new ol.Feature({ geometry: maskGeom })] }),
            style: new ol.style.Style({ fill: new ol.style.Fill({ color: 'rgba(3, 36, 62, 0.85)' }) }),
          })
          maskLayer.setZIndex(40)
          map.value.addLayer(maskLayer)
          foshanLayer.setZIndex(50)

          var extent = source.getExtent()
          if (extent && !isNaN(extent[0])) {
            map.value.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 1000 })
          }
        }
      )
    }
    // onMounted(() => {
    // unref(map).addOverlay(new ol.Overlay({
    //         element: document.getElementById('fixed-image'), // 绑定 HTML 元素
    //         position: [113.12, 23.02],                      // 固定的地理坐标
    //         positioning: 'center-center',                   // 元素的中心点对齐坐标
    //         stopEvent: false                                // 允许鼠标透过图片拖拽地图
    //       }))
    // })
    return {
      addCvaLayer, removeCvaLayer, removeCvaLayerById, addFoShanGeojson,
      doSearchCoordinate, lonInput, latInput, pointerCoord, pickedCoord,
      showTools, coordToolActive, toggleCoordTool,
      districtTooltip, districtLoaded, toggleDistrictLayer,
      dotLoading, dotLoaded, toggleDotLayer, dotPopup,
    }
  }
}).mount('#app')