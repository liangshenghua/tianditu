import { unref, ref } from '../lib/dist/vue.esm-browser.prod.js'

// 海量点位聚类图层 hook，从 /static/dot.json 加载企业点位并聚类渲染
function useDotLayer (map) {
  let dotLayer = null
  const loading = ref(false)
  const loaded = ref(false)

  // 点击弹窗数据
  const popup = ref({ show: false, x: 0, y: 0, title: '', items: [], isCluster: false })

  let clickHandler = null

  async function addDotLayer () {
    if (loading.value || loaded.value) return
    loading.value = true

    try {
      const resp = await fetch('/static/dot-1.json')
      const json = await resp.json()

      if (json.code !== 200) {
        console.error('加载点位数据失败:', json.message)
        return
      }

      const enterprises = json.data.enterprises || []

      const features = []
      for (let i = 0; i < enterprises.length; i++) {
        const item = enterprises[i]
        if (item.lon == null || item.lat == null) continue
        const feature = new ol.Feature({
          geometry: new ol.geom.Point([item.lon, item.lat]),
          id: item.id,
          name: item.name || '',
          industry: item.industry || '',
          district: item.district || '',
          honorInfo: item.honorInfo || '',
          enterpriseKind: item.enterpriseKind,
          creditCode: item.creditCode || '',
          address: item.address || '',
          phone: item.phone || '',
          contact: item.contact || '',
          xdnBqtype: item.xdnBqtype || '',
          ywXdnName: item.ywXdnName || '',
        })
        features.push(feature)
      }

      const source = new ol.source.Vector({ features })
      const clusterSource = new ol.source.Cluster({
        source,
        distance: 45,
      })

      const layer = new ol.layer.Vector({
        source: clusterSource,
        style: function (feature) {
          const clusterFeatures = feature.get('features')
          const size = clusterFeatures.length

          if (size > 1) {
            const radius = Math.min(8 + Math.log2(size) * 4, 28)
            return new ol.style.Style({
              image: new ol.style.Circle({
                radius,
                fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.75)' }),
                stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
              }),
              text: new ol.style.Text({
                text: size > 99 ? '99+' : String(size),
                font: 'bold 12px sans-serif',
                fill: new ol.style.Fill({ color: '#fff' }),
                stroke: new ol.style.Stroke({ color: 'rgba(0,0,0,0.3)', width: 2 }),
              }),
            })
          }

          const point = clusterFeatures[0]
          const kind = point.get('enterpriseKind')
          let color = '#3b82f6'
          if (kind === 1) color = '#ef4444'
          else if (kind === 2) color = '#f59e0b'
          else if (kind === 3) color = '#10b981'

          return new ol.style.Style({
            image: new ol.style.Circle({
              radius: 5,
              fill: new ol.style.Fill({ color }),
              stroke: new ol.style.Stroke({ color: '#fff', width: 1.5 }),
            }),
          })
        },
      })

      layer.set('id', 'dotLayer')
      layer.setZIndex(30)
      dotLayer = layer
      unref(map)?.addLayer(layer)

      // addLayer 之后立即保存引用，防止后续代码抛异常导致图层无法移除
      

      // 注册点击事件
      const m = unref(map)
      clickHandler = function (evt) {
        const pixel = m.getEventPixel(evt.originalEvent)
        const feature = m.forEachFeatureAtPixel(pixel, function (f) { return f }, {
          layerFilter: function (l) { return l.get('id') === 'dotLayer' },
        })

        if (!feature) {
          popup.value = { show: false, x: 0, y: 0, title: '', items: [], isCluster: false }
          return
        }

        const clusterFeatures = feature.get('features')
        const coordinate = feature.getGeometry().getCoordinates()

        // 将坐标转为屏幕像素
        const screenPos = m.getPixelFromCoordinate(coordinate)
        const mapRect = m.getTargetElement().getBoundingClientRect()

        if (clusterFeatures.length > 1) {
          // 聚类：显示前 10 个企业名称
          const names = clusterFeatures.slice(0, 10).map(function (f) {
            return { name: f.get('name'), id: f.get('id') }
          })
          const more = clusterFeatures.length - 10
          popup.value = {
            show: true,
            x: screenPos[0] + mapRect.left,
            y: screenPos[1] + mapRect.top,
            title: '该区域包含 ' + clusterFeatures.length + ' 家企业',
            items: names,
            more: more > 0 ? more : 0,
            isCluster: true,
          }
        } else {
          // 单个企业
          const f = clusterFeatures[0]
          popup.value = {
            show: true,
            x: screenPos[0] + mapRect.left,
            y: screenPos[1] + mapRect.top,
            title: f.get('name'),
            items: [
              { label: '行业', value: f.get('industry') },
              { label: '区域', value: f.get('district') },
              { label: '荣誉', value: f.get('honorInfo') },
              { label: '标签', value: f.get('xdnBqtype') },
              { label: '细分领域', value: f.get('ywXdnName') },
              { label: '地址', value: f.get('address') },
              { label: '信用代码', value: f.get('creditCode') },
            ].filter(function (item) { return item.value }),
            isCluster: false,
          }
        }
      }

      m.on('singleclick', clickHandler)

      loaded.value = true
    } catch (err) {
      console.error('加载点位图层失败:', err)
    } finally {
      loading.value = false
    }
  }

  function removeDotLayer () {
    const m = unref(map)
    if (!m) return

    if (clickHandler) {
        m.un('singleclick', clickHandler)
        clickHandler = null
    }
      m.removeLayer(dotLayer)
      
    dotLayer = null
    loaded.value = false
    popup.value = { show: false, x: 0, y: 0, title: '', items: [], isCluster: false }
  }

  return { addDotLayer, removeDotLayer, loading, loaded, popup }
}

export { useDotLayer }
