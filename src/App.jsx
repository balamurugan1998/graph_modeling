import { useMemo, useRef, useState } from 'react'
import './App.css'

const MIN_VALUE = 2

const GRAPH_TYPES = [
  { value: 'dc', label: 'Delimited Cross Graph', notation: 'DC', description: 'The original delimited cross graph.' },
  { value: 'edc1', label: '1st Edge Augmented DC Graph', notation: 'EDC¹', description: 'The first boundary-edge augmentation.' },
  { value: 'edc2', label: '2nd Edge Augmented DC Graph', notation: 'EDC²', description: 'The complete outer-boundary augmentation.' },
  { value: 'edc3', label: '3rd Edge Augmented DC Graph', notation: 'EDC³', description: 'Horizontal edges augment every full row.' },
  { value: 'edc4', label: '4th Edge Augmented DC Graph', notation: 'EDC⁴', description: 'Full-row edges and both side boundaries are augmented.' },
  { value: 'vedc1', label: '1st Vertex-Edge Augmented DC Graph', notation: 'VEDC¹', description: 'Alternate levels receive two new side vertices.' },
  { value: 'vedc2', label: '2nd Vertex-Edge Augmented DC Graph', notation: 'VEDC²', description: 'Side vertices are joined to the boundary structure.' },
  { value: 'vedc3', label: '3rd Vertex-Edge Augmented DC Graph', notation: 'VEDC³', description: 'Side vertices, boundary links, and full-row edges are augmented.' },
]

function createDelimitedCrossGraph(n, m) {
  const gapX = 118
  const gapY = 86
  const padding = 54
  const nodes = []
  const edges = []

  for (let row = 1; row <= n; row += 1) {
    const columns = row % 2 === 1 ? m : m - 1
    const offsetX = row % 2 === 1 ? 0 : gapX / 2
    for (let column = 1; column <= columns; column += 1) {
      nodes.push({ id: `${row}-${column}`, row, column, x: padding + offsetX + (column - 1) * gapX, y: padding + (row - 1) * gapY })
    }
  }

  for (let row = 1; row < n; row += 1) {
    for (let column = 1; column < m; column += 1) {
      edges.push({ from: `${row}-${column}`, to: `${row + 1}-${column}` })
      if (row % 2 === 1) edges.push({ from: `${row}-${column + 1}`, to: `${row + 1}-${column}` })
      else edges.push({ from: `${row}-${column}`, to: `${row + 1}-${column + 1}` })
    }
  }

  return { nodes, edges, width: padding * 2 + (m - 1) * gapX, height: padding * 2 + (n - 1) * gapY }
}

function createGraph(n, m, type) {
  const graph = createDelimitedCrossGraph(n, m)
  const nodeIds = new Set(graph.nodes.map((node) => node.id))
  const edgeKeys = new Set(graph.edges.map(({ from, to }) => [from, to].sort().join('|')))
  const addEdge = (from, to) => {
    if (!nodeIds.has(from) || !nodeIds.has(to)) return
    const key = [from, to].sort().join('|')
    if (!edgeKeys.has(key)) { edgeKeys.add(key); graph.edges.push({ from, to }) }
  }
  const addRowEdges = (rows) => rows.forEach((row) => {
    const columns = row % 2 === 1 ? m : m - 1
    for (let column = 1; column < columns; column += 1) addEdge(`${row}-${column}`, `${row}-${column + 1}`)
  })
  const addSideRails = () => {
    for (let row = 1; row <= n - 2; row += 2) {
      addEdge(`${row}-1`, `${row + 2}-1`)
      addEdge(`${row}-${m}`, `${row + 2}-${m}`)
    }
  }
  const oddRows = Array.from({ length: Math.ceil(n / 2) }, (_, index) => index * 2 + 1)

  if (['edc1', 'edc2', 'vedc1', 'vedc2'].includes(type)) addRowEdges([1, n])
  if (['edc2', 'edc4', 'vedc2', 'vedc3'].includes(type)) addSideRails()
  if (['edc3', 'edc4', 'vedc3'].includes(type)) addRowEdges(oddRows)

  if (type.startsWith('vedc')) {
    for (let row = 2; row < n; row += 2) {
      const y = graph.nodes.find((node) => node.id === `${row}-1`).y
      const sideNodes = [
        { id: `${row}-0`, row, column: 0, x: 20, y },
        { id: `${row}-${m}`, row, column: m, x: graph.width - 20, y },
      ]
      sideNodes.forEach((node) => { graph.nodes.push(node); nodeIds.add(node.id) })
      addEdge(`${row}-0`, `${row - 1}-1`)
      addEdge(`${row}-0`, `${row + 1}-1`)
      addEdge(`${row}-${m}`, `${row - 1}-${m}`)
      addEdge(`${row}-${m}`, `${row + 1}-${m}`)
      if (type !== 'vedc1') {
        addEdge(`${row}-0`, `${row}-1`)
        addEdge(`${row}-${m}`, `${row}-${m - 1}`)
      }
    }
  }
  return graph
}

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function makeFraction(num, den) {
  if (den === 0 || num === 0) return { num: 0, den: 1 }
  if (den < 0) {
    num = -num
    den = -den
  }
  const g = gcd(num, den)
  return { num: num / g, den: den / g }
}

function addFractions(f1, f2) {
  const num = f1.num * f2.den + f2.num * f1.den
  const den = f1.den * f2.den
  return makeFraction(num, den)
}

function divideFractionByInt(f, k) {
  if (k === 0 || f.num === 0) return { num: 0, den: 1 }
  if (k < 0) {
    return makeFraction(-f.num, f.den * -k)
  }
  return makeFraction(f.num, f.den * k)
}

function formatFraction(f) {
  if (!f || f.num === 0) return '0'
  if (f.den === 1) return `${f.num}`
  return `${f.num}/${f.den}`
}

function fractionToDecimal(f) {
  if (!f || f.den === 0) return 0
  return f.num / f.den
}

function getGraphAdjacency(graph) {
  const adjacency = new Map()
  graph.nodes.forEach((node) => adjacency.set(node.id, []))
  graph.edges.forEach(({ from, to }) => {
    if (adjacency.has(from) && adjacency.has(to)) {
      adjacency.get(from).push(to)
      adjacency.get(to).push(from)
    }
  })
  const degrees = new Map()
  graph.nodes.forEach((node) => {
    degrees.set(node.id, adjacency.get(node.id)?.length || 0)
  })
  return { adjacency, degrees }
}

function calculateLeverageCentrality(graph) {
  if (!graph || !graph.nodes || !graph.nodes.length) {
    return { centralityMap: new Map(), rawFractions: new Map(), maxVal: -Infinity, maxNodeIds: new Set(), maxFrac: null, maxFormatted: '0', displayValues: new Map() }
  }
  const { adjacency, degrees } = getGraphAdjacency(graph)

  const rawFractions = new Map()
  const centralityMap = new Map()
  let maxVal = -Infinity

  graph.nodes.forEach((node) => {
    const degV = degrees.get(node.id) || 0
    const neighbors = adjacency.get(node.id) || []
    if (degV === 0) {
      const frac = makeFraction(0, 1)
      rawFractions.set(node.id, frac)
      centralityMap.set(node.id, 0)
    } else {
      let sumFrac = makeFraction(0, 1)
      neighbors.forEach((neighborId) => {
        const degVi = degrees.get(neighborId) || 0
        const num = degV - degVi
        const den = degV + degVi
        if (den !== 0) {
          sumFrac = addFractions(sumFrac, makeFraction(num, den))
        }
      })
      const lFrac = divideFractionByInt(sumFrac, degV)
      const lVal = fractionToDecimal(lFrac)
      rawFractions.set(node.id, lFrac)
      centralityMap.set(node.id, lVal)
    }
  })

  centralityMap.forEach((val) => {
    if (val > maxVal) maxVal = val
  })

  const maxNodeIds = new Set()
  let maxFrac = null

  if (maxVal !== -Infinity) {
    centralityMap.forEach((val, id) => {
      if (Math.abs(val - maxVal) < 1e-9) {
        maxNodeIds.add(id)
        if (!maxFrac) maxFrac = rawFractions.get(id)
      }
    })
  }

  const displayValues = new Map()
  graph.nodes.forEach((node) => {
    const frac = rawFractions.get(node.id)
    displayValues.set(node.id, frac ? formatFraction(frac) : '0')
  })

  return { centralityMap, rawFractions, maxVal, maxNodeIds, degrees, maxFrac, maxFormatted: formatFraction(maxFrac), displayValues }
}

const CENTRALITY_OPTIONS = [
  {
    value: 'none',
    label: 'None (Standard node labels)',
    shortLabel: 'None',
    description: 'Displays standard vertex indices aᵢⱼ without centrality calculation.',
  },
  {
    value: 'leverage',
    label: 'Leverage Centrality',
    shortLabel: 'Leverage Centrality',
    notation: 'l(v)',
    description: 'Calculates l(v) for each vertex as exact fractions and highlights highest centrality node(s).',
    formula: (
      <>
        l(v) = <sup>1</sup>/<sub>deg(v)</sub> ∑ <sup>(deg(v) − deg(v<sub>i</sub>))</sup>/<sub>(deg(v) + deg(v<sub>i</sub>))</sub>
      </>
    ),
    calculate: (graph) => calculateLeverageCentrality(graph),
  },
  // Ready for 3 more centrality metrics to be added here
]

function calculateCentrality(centralityType, graph) {
  if (!centralityType || centralityType === 'none') return null
  const option = CENTRALITY_OPTIONS.find((opt) => opt.value === centralityType)
  if (!option || !option.calculate) return null
  return option.calculate(graph)
}

function Icon({ name }) {
  const paths = {
    graph: <><circle cx="5" cy="6" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="m7 7 4 10m6-10-4 10M7 6h10"/></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8L5 16Z"/></>,
    nodes: <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="m8 7.5 3 8m5-8-3 8M8.5 6h7"/></>,
    edges: <><path d="M5 19 19 5M5 5l14 14"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function NumberField({ id, label, value, helper, onChange }) {
  return <label className="field" htmlFor={id}><span>{label}</span><input id={id} type="number" min={MIN_VALUE} step="1" value={value} onChange={(event) => onChange(event.target.value)} required /><small>{helper}</small></label>
}

function GraphCanvas({ graph, n, m, graphName, centralityType, centralityData }) {
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const svgRef = useRef(null)
  const shellRef = useRef(null)

  const isCentralityActive = centralityType !== 'none' && centralityData != null

  const changeZoom = (amount) => setZoom((current) => Math.min(2, Math.max(.5, Number((current + amount).toFixed(1)))))

  const downloadPng = () => {
    const svg = svgRef.current.cloneNode(true)
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('width', graph.width)
    svg.setAttribute('height', graph.height)
    svg.removeAttribute('style')
    const styles = document.createElementNS('http://www.w3.org/2000/svg', 'style')
    styles.textContent = `
      .edges line { stroke:#586a61; stroke-width:2.2; stroke-linecap:round; opacity:.82 }
      .node circle { fill:#fff; stroke:#ed6335; stroke-width:2.2 }
      .node .node-core { fill:#ed6335; stroke:none }
      .node text { fill:#353d38; font:italic 13px Georgia,serif; paint-order:stroke; stroke:#fff; stroke-width:4px; stroke-linejoin:round }
      .node .subscript { font-size:8px; font-style:normal; stroke-width:3px }
      .node.is-max-node circle { stroke:#d97706; stroke-width:3 }
      .node.is-max-node .node-core { fill:#d97706 }
      .max-node-halo { fill:rgba(245,158,11,0.25); stroke:#f59e0b; stroke-width:2.2 }
      .max-label-bg { fill:#fef3c7; stroke:#f59e0b; stroke-width:1 }
      .numeric-label { font-family:'Manrope',sans-serif; font-weight:700; font-size:12px; font-style:normal }
      .max-text { fill:#92400e !important; font-weight:800 }
    `
    svg.prepend(styles)
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(2, 8192 / graph.width, 8192 / graph.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(graph.width * scale)
      canvas.height = Math.round(graph.height * scale)
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${graphName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${n}x${m}.png`
      link.click()
      URL.revokeObjectURL(url)
    }
    image.onerror = () => URL.revokeObjectURL(url)
    image.src = url
  }

  const openFullscreen = () => shellRef.current?.requestFullscreen?.()

  return <div className="canvas-area">
    <div className="canvas-toolbar" aria-label="Graph view controls">
      <div className="graph-legend">
        <span><i className="legend-node" /> Vertex</span>
        <span><i className="legend-edge" /> Edge</span>
        {isCentralityActive && (
          <span className="legend-max"><i className="legend-max-node" /> Max Centrality</span>
        )}
      </div>
      <div className="view-controls">
        <button type="button" onClick={() => changeZoom(-.1)} aria-label="Zoom out">−</button>
        <output aria-label="Current zoom">{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => changeZoom(.1)} aria-label="Zoom in">+</button>
        <button type="button" className={showLabels ? 'active' : ''} aria-pressed={showLabels} onClick={() => setShowLabels((value) => !value)}>Labels</button>
        <button className="fit-button" type="button" onClick={() => setZoom(1)}>Reset</button>
        <button type="button" onClick={openFullscreen}>Fullscreen</button>
        <button className="download-button" type="button" onClick={downloadPng}>Download PNG</button>
      </div>
    </div>
    <div className="graph-shell" ref={shellRef}>
    <div className="graph-grid" aria-hidden="true" />
    <svg ref={svgRef} className="graph-svg" style={{ width: Math.max(graph.width, 480) * zoom, height: Math.max(graph.height, 420) * zoom }} viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label={`${graphName} with ${n} rows and ${m} columns`}>
      <g className="edges">
        {graph.edges.map((edge, index) => {
          const start = nodeById.get(edge.from);
          const end = nodeById.get(edge.to);
          return <line key={`${edge.from}-${edge.to}-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} style={{ animationDelay: `${Math.min(index * 14, 600)}ms` }} />
        })}
      </g>
      <g className="nodes">
        {graph.nodes.map((node, index) => {
          const isMaxNode = isCentralityActive && centralityData.maxNodeIds.has(node.id)
          const displayVal = isCentralityActive ? centralityData.displayValues.get(node.id) ?? '0' : ''
          const labelWidth = Math.max(44, (displayVal.length + 1) * 8.5)
          return (
            <g className={`node ${isMaxNode ? 'is-max-node' : ''}`} key={node.id} transform={`translate(${node.x} ${node.y})`} style={{ animationDelay: `${Math.min(index * 18, 700)}ms` }}>
              {isMaxNode && <circle className="max-node-halo" r="16" />}
              <circle r="8"/>
              <circle className="node-core" r="3"/>
              {showLabels && (
                isCentralityActive ? (
                  <g className="numeric-label-group">
                    {isMaxNode && (
                      <rect x={-labelWidth / 2} y="-28" width={labelWidth} height="17" rx="4" className="max-label-bg" />
                    )}
                    <text y="-15" textAnchor="middle" className={`numeric-label ${isMaxNode ? 'max-text' : ''}`}>
                      {displayVal}
                    </text>
                  </g>
                ) : (
                  <text y="-16" textAnchor="middle">a<tspan className="subscript" dy="3">{node.row}{node.column}</tspan></text>
                )
              )}
            </g>
          )
        })}
      </g>
    </svg>
    </div>
  </div>
}

function App() {
  const [nInput, setNInput] = useState('5')
  const [mInput, setMInput] = useState('4')
  const [values, setValues] = useState({ n: 5, m: 4 })
  const [graphType, setGraphType] = useState('dc')
  const [centralityType, setCentralityType] = useState('none')
  const [error, setError] = useState('')

  const selectedType = GRAPH_TYPES.find((type) => type.value === graphType) ?? GRAPH_TYPES[0]
  const selectedCentrality = CENTRALITY_OPTIONS.find((type) => type.value === centralityType) ?? CENTRALITY_OPTIONS[0]
  const graph = useMemo(() => createGraph(values.n, values.m, graphType), [values, graphType])

  const centralityData = useMemo(() => {
    return calculateCentrality(centralityType, graph)
  }, [graph, centralityType])

  const averageDegree = graph.nodes.length ? (2 * graph.edges.length / graph.nodes.length).toFixed(2) : '0'
  const density = graph.nodes.length > 1 ? (200 * graph.edges.length / (graph.nodes.length * (graph.nodes.length - 1))).toFixed(1) : '0'

  const applyExample = (n, m) => {
    setNInput(String(n)); setMInput(String(m)); setValues({ n, m }); setError('')
  }

  const handleGraphTypeChange = (newType) => {
    setGraphType(newType)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const n = Number(nInput); const m = Number(mInput)
    if (!Number.isInteger(n) || !Number.isInteger(m)) return setError('Please enter whole numbers for both n and m.')
    if (n < MIN_VALUE || m < MIN_VALUE) return setError(`Choose values of at least ${MIN_VALUE}.`)
    if (n % 2 === 0) return setError('n must be an odd number, as required by the formula.')
    setError(''); setValues({ n, m })
  }

  return <main>
    <header className="app-header" id="top">
      <a className="brand" href="#top" aria-label="Delimited Cross Graph Explorer home"><span className="brand-mark"><Icon name="graph" /></span><span>Graphica</span></a>
      <div className="header-divider" />
      <div className="header-copy"><span className="header-kicker">Graph theory workspace</span><h1>Delimited Cross Graph Explorer</h1><p>Generate DC, edge-augmented, and vertex-edge-augmented graph families.</p></div>
      <div className="family-pills" aria-label="Supported graph families"><span>DC</span><span>EDC 1–4</span><span>VEDC 1–3</span></div>
    </header>
    <section className="workspace" aria-label="Graph generator">
      <aside className="control-panel"><div className="panel-heading"><span>Parameters</span><span className="step">01</span></div><form onSubmit={handleSubmit}>
        <div className="examples"><span>Quick examples</span><div><button type="button" onClick={() => applyExample(3, 2)}>3 × 2</button><button type="button" onClick={() => applyExample(5, 3)}>5 × 3</button><button type="button" onClick={() => applyExample(7, 4)}>7 × 4</button></div></div>
        <NumberField id="n-value" label="Number of rows (n)" value={nInput} helper="Any odd integer of 3 or more" onChange={setNInput} />
        <NumberField id="m-value" label="Maximum columns (m)" value={mInput} helper="Any integer of 2 or more" onChange={setMInput} />
        <label className="field" htmlFor="graph-type"><span>Graph type</span><select id="graph-type" value={graphType} onChange={(event) => handleGraphTypeChange(event.target.value)}><optgroup label="Base graph"><option value="dc">Delimited Cross Graph</option></optgroup><optgroup label="Edge Augmented">{GRAPH_TYPES.filter((type) => type.value.startsWith('edc')).map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</optgroup><optgroup label="Vertex-Edge Augmented">{GRAPH_TYPES.filter((type) => type.value.startsWith('vedc')).map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</optgroup></select><small>Grouped by graph family for easier selection</small></label>
        
        <label className="field" htmlFor="centrality-type">
          <span>Centrality measure</span>
          <select
            id="centrality-type"
            value={centralityType}
            onChange={(event) => setCentralityType(event.target.value)}
          >
            {CENTRALITY_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <small>{selectedCentrality.description}</small>
        </label>

        {error && <p className="error" role="alert">{error}</p>}<button className="generate-button" type="submit">Generate graph <span aria-hidden="true">→</span></button>
      </form>
      <div className="formula-card"><span className="formula-label">Graph notation</span><strong>G = {selectedType.notation}<sub>{values.n}×{values.m}</sub></strong><p>{selectedType.description} Odd rows contain m vertices; even rows contain m − 1.</p></div>
      
      {centralityType !== 'none' && centralityData && (
        <div className="formula-card leverage-card">
          <div className="leverage-card-header">
            <span className="formula-label">{selectedCentrality.label} Analysis</span>
            <span className="max-value-pill">Max: {centralityData.maxFormatted}</span>
          </div>
          {selectedCentrality.formula && (
            <div className="leverage-formula-box">
              {selectedCentrality.formula}
            </div>
          )}
          <p className="max-nodes-list">
            Highest Node(s): <strong>{Array.from(centralityData.maxNodeIds).map(id => {
              const node = graph.nodes.find(n => n.id === id);
              return node ? `a${node.row}${node.column}` : id;
            }).join(', ')}</strong> ({centralityData.maxFormatted})
          </p>
        </div>
      )}

      <details className="help-card"><summary>How to read this graph</summary><p>Each orange circle is a labelled vertex a<sub>ij</sub>, where <i>i</i> is its row and <i>j</i> is its position. Lines show the edges connecting two vertices.</p></details></aside>
      <section className="visual-panel"><div className="visual-heading"><div><span className="section-kicker">Generated structure</span><h2>{selectedType.notation}<sub>{values.n}×{values.m}</sub></h2><p className="graph-type-name">{selectedType.label}</p></div><span className="live-status"><i /> Live preview</span></div><GraphCanvas graph={graph} n={values.n} m={values.m} graphName={selectedType.label} centralityType={centralityType} centralityData={centralityData} /><div className="stats"><div><span className="stat-icon"><Icon name="nodes" /></span><p><strong>{graph.nodes.length}</strong><small>Vertices</small></p></div><div><span className="stat-icon"><Icon name="edges" /></span><p><strong>{graph.edges.length}</strong><small>Edges</small></p></div><div><span className="stat-icon metric-icon">μ</span><p><strong>{averageDegree}</strong><small>Avg. degree</small></p></div><div><span className="stat-icon metric-icon">%</span><p><strong>{density}%</strong><small>Density</small></p></div><div className="definition"><small>Current definition</small><strong>n = {values.n}, m = {values.m}</strong></div></div></section>
    </section>
    <footer><span>Graphica · Delimited cross graph visualizer</span><span>Built for mathematical exploration</span></footer>
  </main>
}

export default App
