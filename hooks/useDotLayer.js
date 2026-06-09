import { unref, ref } from '../lib/dist/vue.esm-browser.prod.js'
import { createPulseRingStyles, PULSE_CYCLE_MS, MAP_MARKER_PALETTE } from '../utils/pulse.js'

// ============================================================
// 常量配置
// ============================================================

/** 企业数据接口地址 */
const ENTERPRISE_DATA_URL = '/static/dot-1.json'

/** 企业字段列表（后端字段名 → Feature 属性名，与 JSON 字段一一对应） */
const ENTERPRISE_FIELDS = [
  'id', 'name', 'industry', 'district', 'honorInfo',
  'enterpriseKind', 'creditCode', 'address', 'phone',
  'contact', 'xdnBqtype', 'ywXdnName',
]

/** 企业类型 → 点标记颜色映射 */
const KIND_COLORS = { 1: '#ef4444', 2: '#f59e0b', 3: '#10b981' }
const DEFAULT_COLOR = '#3b82f6'

/** 弹窗字段配置列表 */
const POPUP_FIELDS = [
  { label: '行业', key: 'industry' },
  { label: '区域', key: 'district' },
  { label: '荣誉', key: 'honorInfo' },
  { label: '标签', key: 'xdnBqtype' },
  { label: '细分领域', key: 'ywXdnName' },
  { label: '地址', key: 'address' },
  { label: '信用代码', key: 'creditCode' },
]

/** 弹窗最多显示企业数 */
const CLUSTER_POPUP_MAX = 10

// ============================================================
// Hook
// ============================================================

function useDotLayer (map) {
  let dotLayer = null
  const loading = ref(false)
  const loaded = ref(false)
  let pulseRafId = null
  let pulsePhase = null
  const popup = ref(emptyPopup())
  let clickHandler = null

  // ==========================================================
  // 内部工具
  // ==========================================================

  /** 空弹窗状态 */
  function emptyPopup () {
    return { show: false, x: 0, y: 0, title: '', items: [], isCluster: false }
  }

  /** 企业数据 → OL Feature 数组 */
  function buildFeatures (enterprises) {
    const features = []
    for (let i = 0; i < enterprises.length; i++) {
      const item = enterprises[i]
      if (item.lon == null || item.lat == null) continue
      const props = { geometry: new ol.geom.Point([item.lon, item.lat]) }
      for (let j = 0; j < ENTERPRISE_FIELDS.length; j++) {
        const key = ENTERPRISE_FIELDS[j]
        props[key] = item[key] ?? ''
      }
      features.push(new ol.Feature(props))
    }
    return features
  }

  // ==========================================================
  // 样式函数
  // ==========================================================

  /**
   * 聚类图层样式函数
   *
   * - 聚合点（size > 1）：扩散光圈 + 数字标签
   * - 单个点：按 enterpriseKind 着色的圆点
   */
  function clusterStyleFunction (feature) {
    const clusterFeatures = feature.get('features')
    const size = clusterFeatures.length

    if (size > 1) {
      // 聚类：光圈扩散 + 计数
      const radius = Math.min(8 + Math.log2(size) * 4, 28)
      return [
        ...createPulseRingStyles(radius, {
          phase: pulsePhase,
          inner: { stroke: MAP_MARKER_PALETTE.teal.primary, fill: MAP_MARKER_PALETTE.teal.ringFill, width: 2 },
          outer: { strokeRgb: [0, 212, 255], fillRgb: [0, 150, 255], width: 1.5, dash: [7, 4] },
        }),
        new ol.style.Style({
          image: new ol.style.Circle({
            radius,
            fill: new ol.style.Fill({ color: 'rgba(59, 130, 246, 0.75)' }),
            // stroke: new ol.style.Stroke({ color: '#fff', width: 2 }),
          }),
          text: new ol.style.Text({
            text: size > 99 ? '99+' : String(size),
            font: 'bold 12px sans-serif',
            fill: new ol.style.Fill({ color: '#fff' }),
            stroke: new ol.style.Stroke({ color: 'rgba(0,0,0,0.3)', width: 2 }),
          }),
        }),
      ]
    }

    // 单个企业：按类型着色
    const kind = clusterFeatures[0].get('enterpriseKind')
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 5,
        fill: new ol.style.Fill({ color: KIND_COLORS[kind] || DEFAULT_COLOR }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 1.5 }),
      }),
    })
  }

  // ==========================================================
  // 弹窗数据
  // ==========================================================

  /** 聚类弹窗数据 */
  function buildClusterPopup (features, screenX, screenY) {
    const names = features.slice(0, CLUSTER_POPUP_MAX).map(f => ({
      name: f.get('name'),
      id: f.get('id'),
    }))
    const more = features.length - CLUSTER_POPUP_MAX
    return {
      show: true, x: screenX, y: screenY,
      title: `该区域包含 ${features.length} 家企业`,
      items: names,
      more: more > 0 ? more : 0,
      isCluster: true,
    }
  }

  /** 单个企业弹窗数据 */
  function buildEnterprisePopup (feature, screenX, screenY) {
    const items = []
    for (let i = 0; i < POPUP_FIELDS.length; i++) {
      const { label, key } = POPUP_FIELDS[i]
      const value = feature.get(key)
      if (value) items.push({ label, value })
    }
    return {
      show: true, x: screenX, y: screenY,
      title: feature.get('name'),
      items,
      isCluster: false,
    }
  }

  // ==========================================================
  // 脉冲动画循环
  // ==========================================================

  /** 脉冲刷新间隔（ms），20fps 对慢速脉冲足够流畅且大幅降低重绘开销 */
  const PULSE_INTERVAL = 50

  /**
   * requestAnimationFrame 驱动的脉冲动画循环（限频 ~20fps）
   *
   * 脉冲周期 2600ms，光圈变化缓慢，无需 60fps。
   * 通过时间戳跳过中间帧，将 OpenLayers 重绘频率从 60fps 降到 20fps，
   * 减少 2/3 的 style 函数重算开销。
   *
   * 每一帧：
   *   1. pulsePhase = (Date.now() % 2600) / 2600  →  0~1 循环
   *   2. dotLayer.changed() 触发 OpenLayers 重绘
   *   3. style 函数读到 pulsePhase，传给 createPulseRingStyles
   */
  function startPulseLoop () {
    if (pulseRafId != null) return
    let lastTick = 0
    function tick (now) {
      if (now - lastTick >= PULSE_INTERVAL) {
        lastTick = now
        pulsePhase = (Date.now() % PULSE_CYCLE_MS) / PULSE_CYCLE_MS
        dotLayer?.changed?.()
      }
      pulseRafId = requestAnimationFrame(tick)
    }
    pulseRafId = requestAnimationFrame(tick)
  }

  function stopPulseLoop () {
    if (pulseRafId != null) {
      cancelAnimationFrame(pulseRafId)
      pulseRafId = null
    }
  }

  // ==========================================================
  // 点击处理
  // ==========================================================

  function createClickHandler (m) {
    return function (evt) {
      const pixel = m.getEventPixel(evt.originalEvent)
      const feature = m.forEachFeatureAtPixel(pixel, f => f, {
        layerFilter: l => l.get('id') === 'dotLayer',
      })

      if (!feature) {
        popup.value = emptyPopup()
        return
      }

      const clusterFeatures = feature.get('features')
      const coordinate = feature.getGeometry().getCoordinates()
      const screenPos = m.getPixelFromCoordinate(coordinate)
      const mapRect = m.getTargetElement().getBoundingClientRect()
      const screenX = screenPos[0] + mapRect.left
      const screenY = screenPos[1] + mapRect.top

      popup.value = clusterFeatures.length > 1
        ? buildClusterPopup(clusterFeatures, screenX, screenY)
        : buildEnterprisePopup(clusterFeatures[0], screenX, screenY)
    }
  }

  // ==========================================================
  // 主流程
  // ==========================================================

  async function addDotLayer () {
    if (loading.value || loaded.value) return
    loading.value = true

    try {
      const json = await fetch(ENTERPRISE_DATA_URL).then(r => r.json())
      if (json.code !== 200) {
        console.error('加载点位数据失败:', json.message)
        return
      }

      const features = buildFeatures(json.data.enterprises || [])
      const source = new ol.source.Vector({ features })
      const clusterSource = new ol.source.Cluster({ source, distance: 45 })

      dotLayer = new ol.layer.Vector({
        source: clusterSource,
        style: clusterStyleFunction,
      })
      dotLayer.set('id', 'dotLayer')
      dotLayer.setZIndex(30)

      const m = unref(map)
      m.addLayer(dotLayer)

      clickHandler = createClickHandler(m)
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
    stopPulseLoop()
    m.removeLayer(dotLayer)
    dotLayer = null
    loaded.value = false
    popup.value = emptyPopup()
  }

  return {
    addDotLayer,
    removeDotLayer,
    loading,
    loaded,
    popup,
    _startPulseLoop: startPulseLoop,
  }
}

export { useDotLayer }
