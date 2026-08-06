import { useMemo, useState } from 'react'
import './App.css'

const MIN_VALUE = 2
const MAX_VALUE = 15

// Odd rows have m vertices; even rows have m - 1 vertices.
function createDelimitedCrossGraph(n, m) {
  const gapX = 118
  const gapY = 86
  const padding = 54
  const nodes = []
  const edges = []

  for (let row = 1; row <= n; row += 1) {
    const isOddRow = row % 2 === 1
    const columns = isOddRow ? m : m - 1
    const offsetX = isOddRow ? 0 : gapX / 2

    for (let column = 1; column <= columns; column += 1) {
      nodes.push({
        id: `${row}-${column}`,
        label: `a${row}${column}`,
        row, column,
        x: padding + offsetX + (column - 1) * gapX,
        y: padding + (row - 1) * gapY,
      })
    }
  }

  for (let row = 1; row < n; row += 1) {
    for (let column = 1; column < m; column += 1) {
      const upperLeft = `${row}-${column}`
      const lowerLeft = `${row + 1}-${column}`
      edges.push({ from: upperLeft, to: lowerLeft })

      if (row % 2 === 1) {
        edges.push({ from: `${row}-${column + 1}`, to: lowerLeft })
      } else {
        edges.push({ from: upperLeft, to: `${row + 1}-${column + 1}` })
      }
    }
  }

  return {
    nodes, edges,
    width: padding * 2 + (m - 1) * gapX,
    height: padding * 2 + (n - 1) * gapY,
  }
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
  return <label className="field" htmlFor={id}>
    <span>{label}</span>
    <input id={id} type="number" min={MIN_VALUE} max={MAX_VALUE} value={value} onChange={(event) => onChange(event.target.value)} required />
    <small>{helper}</small>
  </label>
}

function GraphCanvas({ graph, n, m }) {
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])

  return <div className="graph-shell">
    <div className="graph-grid" aria-hidden="true" />
    <svg className="graph-svg" viewBox={`0 0 ${graph.width} ${graph.height}`} role="img" aria-label={`Delimited cross graph with ${n} rows and ${m} columns`}>
      <g className="edges">
        {graph.edges.map((edge, index) => {
          const start = nodeById.get(edge.from)
          const end = nodeById.get(edge.to)
          return <line key={`${edge.from}-${edge.to}-${index}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} style={{ animationDelay: `${Math.min(index * 14, 600)}ms` }} />
        })}
      </g>
      <g className="nodes">
        {graph.nodes.map((node, index) => <g className="node" key={node.id} transform={`translate(${node.x} ${node.y})`} style={{ animationDelay: `${Math.min(index * 18, 700)}ms` }}>
          <circle r="8" />
          <circle className="node-core" r="3" />
          <text y="-16" textAnchor="middle">a<tspan className="subscript" dy="3">{node.row}{node.column}</tspan></text>
        </g>)}
      </g>
    </svg>
  </div>
}

function App() {
  const [nInput, setNInput] = useState('5')
  const [mInput, setMInput] = useState('4')
  const [values, setValues] = useState({ n: 5, m: 4 })
  const [error, setError] = useState('')
  const graph = useMemo(() => createDelimitedCrossGraph(values.n, values.m), [values])

  const handleSubmit = (event) => {
    event.preventDefault()
    const n = Number(nInput)
    const m = Number(mInput)
    if (!Number.isInteger(n) || !Number.isInteger(m)) return setError('Please enter whole numbers for both n and m.')
    if (n < MIN_VALUE || m < MIN_VALUE || n > MAX_VALUE || m > MAX_VALUE) return setError(`Choose values between ${MIN_VALUE} and ${MAX_VALUE}.`)
    if (n % 2 === 0) return setError('n must be an odd number, as required by the formula.')
    setError('')
    setValues({ n, m })
  }

  return <main>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Graphica home"><span className="brand-mark"><Icon name="graph" /></span><span>Graphica</span></a>
      <span className="header-tag">Delimited Cross Graph Visualizer</span>
    </header>

    <section className="hero-section" id="top">
      <div className="eyebrow"><Icon name="spark" /> Interactive graph theory tool</div>
      <h1>Turn mathematical structures<br />into <em>visual clarity.</em></h1>
      <p>Enter your parameters and instantly generate a precise, interactive representation of a delimited cross graph.</p>
    </section>

    <section className="workspace" aria-label="Graph generator">
      <aside className="control-panel">
        <div className="panel-heading"><span>Parameters</span><span className="step">01</span></div>
        <form onSubmit={handleSubmit}>
          <NumberField id="n-value" label="Number of rows (n)" value={nInput} helper="Must be an odd integer" onChange={setNInput} />
          <NumberField id="m-value" label="Maximum columns (m)" value={mInput} helper="At least 2 columns" onChange={setMInput} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="generate-button" type="submit">Generate graph <span aria-hidden="true">→</span></button>
        </form>
        <div className="formula-card"><span className="formula-label">Graph notation</span><strong>G = DC<sub>{values.n}×{values.m}</sub></strong><p>Odd rows contain m vertices; even rows contain m − 1.</p></div>
      </aside>

      <section className="visual-panel">
        <div className="visual-heading"><div><span className="section-kicker">Generated structure</span><h2>DC<sub>{values.n}×{values.m}</sub></h2></div><span className="live-status"><i /> Live preview</span></div>
        <GraphCanvas graph={graph} n={values.n} m={values.m} />
        <div className="stats">
          <div><span className="stat-icon"><Icon name="nodes" /></span><p><strong>{graph.nodes.length}</strong><small>Vertices</small></p></div>
          <div><span className="stat-icon"><Icon name="edges" /></span><p><strong>{graph.edges.length}</strong><small>Edges</small></p></div>
          <div className="definition"><small>Current definition</small><strong>n = {values.n}, m = {values.m}</strong></div>
        </div>
      </section>
    </section>

    <footer><span>Graphica · Delimited cross graph visualizer</span><span>Built for mathematical exploration</span></footer>
  </main>
}

export default App
