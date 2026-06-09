// ============================================================
// 脉冲扩散动画工具
// 提供光圈脉冲（呼吸灯）效果的数学计算与 OpenLayers 样式生成
// ============================================================

/** 单个脉冲周期（ms） */
export const PULSE_CYCLE_MS = 2600

/** 外环最大扩散增量（px） */
export const PULSE_EXPAND_SPAN = 28

/** 地图标记配色 — 科技风定位图标色板 */
export const MAP_MARKER_PALETTE = {
  teal: {
    primary: '#00D4FF',
    deep: '#0099CC',
    glow: 'rgba(0, 212, 255, 0.55)',
    ring: 'rgba(0, 212, 255, 0.55)',
    ringFill: 'rgba(0, 180, 255, 0.14)',
    innerRing: '#00D4FF',
    outerRing: 'rgba(0, 212, 255, 0.75)',
  },
  green: {
    primary: '#4CD964',
    deep: '#2ECC71',
    glow: 'rgba(76, 217, 100, 0.5)',
    ring: 'rgba(76, 217, 100, 0.35)',
    ringFill: 'rgba(76, 217, 100, 0.1)',
  },
  orange: {
    primary: '#FF9500',
    deep: '#FF6B00',
    glow: 'rgba(255, 149, 0, 0.55)',
    ring: 'rgba(255, 149, 0, 0.4)',
    ringFill: 'rgba(255, 149, 0, 0.12)',
  },
  gold: {
    primary: '#FFD700',
    deep: '#FFB020',
    glow: 'rgba(255, 215, 0, 0.55)',
    ring: 'rgba(255, 215, 0, 0.45)',
    ringFill: 'rgba(255, 215, 0, 0.14)',
    innerRing: '#FFD700',
    outerRing: 'rgba(255, 215, 0, 0.8)',
  },
}

/**
 * RGB 数组 → rgba 字符串（alpha 自动 clamp 到 [0,1]）
 */
export function rgbaFromRgb ([r, g, b], a) {
  const alpha = Math.max(0, Math.min(1, a))
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
}

/**
 * 脉冲透明度：相位 0→1 线性衰减 1→0
 * @param {number} phase  当前相位 0~1
 * @param {number} [offset=0]  相位偏移（0~1）
 */
export function pulseAlpha (phase, offset = 0) {
  const p = (phase + offset) % 1
  return Math.max(0, 1 - p)
}

/**
 * 脉冲半径：相位 0→1 从 base 扩展到 base + span（ease-out）
 * @param {number} base    基准半径
 * @param {number} phase   当前相位 0~1
 * @param {number} [offset=0]  相位偏移
 * @param {number} [span=PULSE_EXPAND_SPAN]  最大扩散增量
 */
export function pulseRadius (base, phase, offset = 0, span = PULSE_EXPAND_SPAN) {
  const p = (phase + offset) % 1
  // ease-out 曲线：前期快速扩散，后期趋于平稳，视觉上更自然
  const ease = 1 - Math.pow(1 - p, 1.85)
  return base + ease * span
}

/**
 * 创建扩散光圈样式集合
 *
 * 包含三层：
 *   1. 内环实心圆 — 固定大小，带填充和描边
 *   2. 外环扩散圆 — 半径随时间扩展，透明度逐渐降低（相位偏移 0）
 *   3. 外环扩散圆 — 同上，相位偏移 0.5，虚线描边
 *
 * 第 2、3 层配合形成连续波纹扩散效果。
 *
 * @param {number} baseRadius  聚类圆基准半径
 * @param {Object} [opts]
 * @param {number}  [opts.phase]       当前脉冲相位 0~1（默认 0）
 * @param {Object}  [opts.inner]       内环样式 `{ stroke, fill, width }`
 * @param {Object}  [opts.outer]       外环样式 `{ strokeRgb, fillRgb, width, dash }`
 * @param {number}  [opts.innerPad=6]  内环比基准半径大出的像素
 * @param {number}  [opts.outerPad=10] 外环起始半径的额外增量
 * @param {number}  [opts.expandSpan]  外环扩散最大增量
 * @returns {ol.style.Style[]}
 */
export function createPulseRingStyles (baseRadius, opts = {}) {
  const inner = opts.inner || { stroke: '#00D4FF', fill: 'rgba(0,212,255,0.16)', width: 2 }
  const outer = opts.outer || { strokeRgb: [0, 212, 255], fillRgb: [0, 150, 255], width: 1.5, dash: [7, 4] }
  const phase = opts.phase ?? 0
  const innerPad = opts.innerPad ?? 6
  const outerPad = opts.outerPad ?? 10
  const expandSpan = opts.expandSpan ?? PULSE_EXPAND_SPAN
  const styles = []

  // 1. 内环 — 固定大小实心圆
  styles.push(new ol.style.Style({
    image: new ol.style.Circle({
      radius: baseRadius + innerPad,
      fill: new ol.style.Fill({ color: inner.fill }),
      stroke: new ol.style.Stroke({ color: inner.stroke, width: inner.width }),
    }),
  }))

  // 2-3. 两层外环扩散圈（相位差 0.5，形成连续波纹）
  for (let i = 0; i < 2; i++) {
    const offset = i * 0.5
    const alpha = pulseAlpha(phase, offset)
    if (alpha <= 0.02) continue
    const r = pulseRadius(baseRadius + outerPad, phase, offset, expandSpan)
    styles.push(new ol.style.Style({
      image: new ol.style.Circle({
        radius: r,
        fill: new ol.style.Fill({ color: rgbaFromRgb(outer.fillRgb, 0.2 * alpha) }),
        stroke: new ol.style.Stroke({
          color: rgbaFromRgb(outer.strokeRgb, 0.92 * alpha),
          width: outer.width,
          lineDash: i === 1 ? outer.dash : undefined,
        }),
      }),
    }))
  }

  return styles
}
