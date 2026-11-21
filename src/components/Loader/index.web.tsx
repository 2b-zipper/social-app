import {useEffect, useRef} from 'react'
import {StyleSheet} from 'react-native'

import {useTheme} from '#/alf'
import * as m3e from '#/alf/m3e'
import {type Props, useCommonSVGProps} from '#/components/icons/common'

const SHAPES: ReadonlyArray<readonly [number, number, number, number]> = [
  [0, 10, 0.18, 0],
  [0, 9, 0.12, 0],
  [0, 5, 0.16, 0],
  [1, 0.6, 2.6, Math.PI / 4],
  [0, 8, 0.14, 0],
  [0, 4, 0.2, 0],
  [1, 0.75, 2, -Math.PI / 4],
]

const SAMPLES = 72
const MORPH_MS = 650
const LOOP_MS = MORPH_MS * SHAPES.length
const LOOP_SPIN_DEG = 450
const INDICATOR_SCALE = 0.84

const SPRING_DAMPING = 0.6
const SPRING_OMEGA = Math.sqrt(200)
const SPRING_OMEGA_D =
  SPRING_OMEGA * Math.sqrt(1 - SPRING_DAMPING * SPRING_DAMPING)

function shapeRadius(
  shape: readonly [number, number, number, number],
  theta: number,
) {
  if (shape[0] === 0) {
    return 1 - (shape[2] * (1 - Math.cos(shape[1] * theta))) / 2
  }
  const phi = theta - shape[3]
  const n = shape[2]
  return Math.pow(
    Math.pow(Math.abs(Math.cos(phi)), n) +
      Math.pow(Math.abs(Math.sin(phi)) / shape[1], n),
    -1 / n,
  )
}

function morphSpring(seconds: number) {
  const decay = Math.exp(-SPRING_DAMPING * SPRING_OMEGA * seconds)
  return (
    1 -
    decay *
      (Math.cos(SPRING_OMEGA_D * seconds) +
        ((SPRING_DAMPING * SPRING_OMEGA) / SPRING_OMEGA_D) *
          Math.sin(SPRING_OMEGA_D * seconds))
  )
}

function indicatorPath(elapsed: number, size: number) {
  const step = Math.floor(elapsed / MORPH_MS)
  const morph = morphSpring((elapsed % MORPH_MS) / 1000)
  const rotation =
    (((elapsed / LOOP_MS) * LOOP_SPIN_DEG + (step + morph) * 90) * Math.PI) /
    180
  const from = SHAPES[step % SHAPES.length]
  const to = SHAPES[(step + 1) % SHAPES.length]
  const center = size / 2
  const radius = center * INDICATOR_SCALE

  let d = ''
  for (let i = 0; i < SAMPLES; i++) {
    const theta = (2 * Math.PI * i) / SAMPLES
    const r0 = shapeRadius(from, theta)
    const r = Math.max(0, r0 + (shapeRadius(to, theta) - r0) * morph) * radius
    const x = center + r * Math.cos(theta + rotation)
    const y = center + r * Math.sin(theta + rotation)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return d + 'Z'
}

export function Loader(props: Props) {
  const t = useTheme()
  const {width, height} = useCommonSVGProps(props)
  const rawColor =
    props.fill ??
    StyleSheet.flatten(props.style)?.color ??
    m3e.colors(t).primary
  const color = typeof rawColor === 'string' ? rawColor : m3e.colors(t).primary
  const size = Math.min(width, height)
  const pathRef = useRef<SVGPathElement | null>(null)

  useEffect(() => {
    let rafId = 0
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - start) % LOOP_MS
      const d = indicatorPath(elapsed, size)
      pathRef.current?.setAttribute('d', d)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [size])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`${(size - width) / 2} ${(size - height) / 2} ${width} ${height}`}
      data-testid={props.testID}>
      <path ref={pathRef} d={indicatorPath(0, size)} fill={color} />
    </svg>
  )
}
