import './App.css'
import censusData from '../public/census_tissue_hist.json'
import Plot from 'react-plotly.js'
import { useEffect, useMemo } from "react";
import useSessionStorageState from "use-session-storage-state";
import useLocalStorageState from "use-local-storage-state";
import { A } from "@rdub/base";

const { log10, min, max } = Math

export type Species = 'homo_sapiens' | 'mus_musculus'
export const Species = [ 'homo_sapiens', 'mus_musculus' ]
export type Census =
  | "2023-05-15"
  | "2023-07-25"
  | "2023-12-15"
  | "2024-07-01"
  | "2025-01-30"

export const CensusVersions: Census[] = [
  "2023-05-15",
  "2023-07-25",
  "2023-12-15",
  "2024-07-01",
  "2025-01-30",
]

export const PrimaryStrs = new Map<boolean | null, string>([
  [null, 'All'],
  [true, 'Primary'],
  [false, 'Secondary'],
]);

function humanize(num: number): string {
  if (num >= 1e6) {
    return `${(num / 1e6).toPrecision(3)}M`
  } else if (num >= 1e3) {
    return `${(num / 1e3).toPrecision(3)}k`
  } else {
    return `${num}`
  }
}

function titleCase(s: string): string {
  return s.split(/[_ ]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function unsnake(s: string): string {
  return s.replace('_', ' ')
}

function App() {
  const [ species, setSpecies ] = useSessionStorageState<Species>('species', { defaultValue: 'homo_sapiens' })
  const [ census, setCensus ] = useSessionStorageState<Census>('census', { defaultValue: '2025-01-30' })
  const [ isPrimary, setIsPrimary ] = useSessionStorageState<boolean | null>('isPrimary', { defaultValue: true })
  const { hist, nCells, totalCells, } = useMemo(
    () => {
      let hist = censusData.filter(
        o =>
          o.species === species &&
          o.census === census &&
          (isPrimary === null || o.is_primary === isPrimary)
      ).map(({ tissue, n_cells }) => ({
        tissue: titleCase(tissue),
        n_cells,
      }))
      let byTissue: Record<string, number> = {}
      hist.forEach(({ tissue, n_cells }) => {
        if (!(tissue in byTissue)) {
          byTissue[tissue] = 0
        }
        byTissue[tissue] += n_cells
      })
      hist = Object.entries(byTissue).map(([ tissue, n_cells ]) => ({ tissue, n_cells }))
      hist.sort((a, b) => a.n_cells - b.n_cells)
      const nCells = hist.map(({ n_cells }) => n_cells)
      const totalCells = nCells.reduce((a, b) => a + b, 0)
      return { hist, nCells, totalCells }
    },
    [species, census, isPrimary]
  )
  const range = [
    log10(nCells.reduce((a, b) => min(a, b))) - .4,
    log10(nCells.reduce((a, b) => max(a, b))) + .5,
  ]
  const isPrimaryStr = PrimaryStrs.get(isPrimary)!
  const [isDarkMode, setIsDarkMode] = useLocalStorageState<boolean | null>(
    "isDarkMode",
    { defaultValue: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches }
  )
  const color = useMemo(() => isDarkMode ? 'white' : 'black', [isDarkMode])
  const bars = useMemo(() => isDarkMode ? '#646cff' : '#646cff', [isDarkMode])
  const gridcolor = useMemo(() => isDarkMode ? '#555' : '#ddd', [isDarkMode])
  useEffect(() => {
    console.log("isDarkMode:", isDarkMode)
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  const y = hist.map(({ tissue }) => tissue)
  const elideAt = 15
  const ticktext = hist.map(({ tissue }) => {
    const abbrev = tissue.length > elideAt + 1 ? (tissue.substring(0, elideAt) + '…') : tissue
    return abbrev + ' '
  })
  const font = { color, size: 11, }
  return (
    <>
      <button className="scheme" onClick={() => setIsDarkMode(!isDarkMode)}>
        {isDarkMode ? '☀️' : '🌘'}
      </button>
      <h2><A href={"https://chanzuckerberg.github.io/cellxgene-census/"}>CELLxGENE Census</A> Cell-Tissue Counts</h2>
      <p>
        <select
          value={census}
          onChange={e => setCensus(e.target.value as Census)}
        >{
          CensusVersions.map(v => <option key={v} value={v}>{v}</option>)
        }</select>
        &nbsp;
        <select
          value={species}
          onChange={e => setSpecies(e.target.value as Species)}
        >{
          Species.map(v => <option key={v} value={v}>{{ 'mus_musculus': 'Mouse', 'homo_sapiens': 'Human', }[v]}</option>)
        }</select>
        &nbsp;
        <select value={isPrimaryStr} onChange={e => setIsPrimary(e.target.value === 'All' ? null : e.target.value === 'Primary')
        }>
          <option value={"All"}>All</option>
          <option value={"Primary"}>Primary only</option>
          <option value={"Secondary"}>Secondary only</option>
        </select>
        &nbsp; | {totalCells.toLocaleString()} cells
      </p>
      <div className={"plot-div"}>
        <Plot
          className={"plot"}
          data={[{
            type: 'bar',
            name: '# Cells',
            x: nCells,
            y,
            customdata: y,
            text: hist.map(({ n_cells }) => humanize(n_cells)),
            textfont: font,
            textposition: 'outside',
            orientation: 'h',
            hovertemplate: '%{customdata}: %{text}',
            marker: { color: bars, }
          }]}
          layout={{
            height: 15 * hist.length,
            autosize: true,
            bargap: .15,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 115, t: 10, b: 20, r: 10 },
            xaxis: {
              type: 'log',
              tickformat: '.0s',
              dtick: 1,
              range,
              gridcolor,
              fixedrange: true,
              tickfont: font,
              title: {
                // text: "# Cells",
                font: { color, },
              },
            },
            yaxis: {
              dtick: 1,
              tickvals: hist.map((_, i) => i),
              ticktext,
              tickfont: font,
            },
          }}
          useResizeHandler
          config={{
            responsive: true,
            displayModeBar: false,
            // displaylogo: false,
            // modeBarButtons: [["toImage"]],
          }}
        />
      </div>
    </>
  )
}

export default App
