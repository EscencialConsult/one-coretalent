import { useEffect, useRef } from 'react'

// Fondo "plexus": red de puntos violeta conectados. Discreto y pareja en todo el fondo.
export default function Plexus() {
  const ref = useRef(null)

  useEffect(() => {
    const svg = ref.current
    const ns = 'http://www.w3.org/2000/svg'
    let timer

    function build() {
      const W = window.innerWidth
      const H = window.innerHeight
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      while (svg.firstChild) svg.removeChild(svg.firstChild)
      const N = Math.max(30, Math.min(70, Math.round((W * H) / 24000)))
      const p = []
      for (let i = 0; i < N; i++) p.push({ x: Math.random() * W, y: Math.random() * H })
      const maxd = Math.min(W, H) * 0.2
      const seen = {}
      const addLine = (a, b) => {
        const k = a < b ? `${a}_${b}` : `${b}_${a}`
        if (seen[k]) return
        seen[k] = 1
        const dx = p[a].x - p[b].x
        const dy = p[a].y - p[b].y
        const d = Math.sqrt(dx * dx + dy * dy)
        const ln = document.createElementNS(ns, 'line')
        ln.setAttribute('x1', p[a].x.toFixed(1))
        ln.setAttribute('y1', p[a].y.toFixed(1))
        ln.setAttribute('x2', p[b].x.toFixed(1))
        ln.setAttribute('y2', p[b].y.toFixed(1))
        ln.setAttribute('stroke', '#4d248f')
        ln.setAttribute('stroke-width', '1.1')
        ln.setAttribute('stroke-opacity', Math.max(0.1, 0.4 * (1 - d / (maxd * 1.6))).toFixed(3))
        svg.appendChild(ln)
      }
      for (let i = 0; i < N; i++) {
        const arr = []
        for (let j = 0; j < N; j++) {
          if (j !== i) {
            const dx = p[i].x - p[j].x
            const dy = p[i].y - p[j].y
            arr.push([dx * dx + dy * dy, j])
          }
        }
        arr.sort((a, b) => a[0] - b[0])
        for (let k = 0; k < 3 && k < arr.length; k++) addLine(i, arr[k][1])
      }
      for (let i = 0; i < N; i++) {
        const c = document.createElementNS(ns, 'circle')
        c.setAttribute('cx', p[i].x.toFixed(1))
        c.setAttribute('cy', p[i].y.toFixed(1))
        c.setAttribute('r', (Math.random() * 1.3 + 1.2).toFixed(1))
        c.setAttribute('fill', '#4d248f')
        c.setAttribute('fill-opacity', '0.6')
        svg.appendChild(c)
      }
    }

    build()
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(build, 200)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <div className="bg">
        <div className="blob a" />
        <div className="blob b" />
        <div className="blob c" />
        <div className="blob d" />
      </div>
      <div className="veil" />
      <svg className="plexus" ref={ref} preserveAspectRatio="xMidYMid slice" aria-hidden="true" />
    </>
  )
}
