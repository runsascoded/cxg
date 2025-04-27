import './App.css'
import censusData from '../public/census_tissue_hist.json'
import Plot from 'react-plotly.js'
import { useMemo, useState } from "react";
const { log10, min, max } = Math

export type Species = 'homo_sapiens' | 'mus_musculus'
export const Species = [ 'homo_sapiens', 'mus_musculus' ]
export type Census = '2023-05-15' | '2024-07-01' | '2025-01-30'
export const CensusVersions: Census[] = ['2023-05-15', '2024-07-01', '2025-01-30']

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
  // return s.split(/[_ ]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function App() {
  const [ species, setSpecies ] = useState<Species>('homo_sapiens')
  const [ census, setCensus ] = useState<Census>('2025-01-30')
  const [ isPrimary, setIsPrimary ] = useState<boolean | null>(true)
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
  const range = [log10(nCells.reduce((a, b) => min(a, b))) - .4, log10(nCells.reduce((a, b) => max(a, b), 0)) + .5]
  // console.log(censusData)
  // const primary = isPrimary !== false
  // const secondary = isPrimary !== true
  const isPrimaryStr = { null: 'All', true: 'Primary', false: 'Secondary' }[isPrimary]
  // console.log("primary:", primary, "secondary:", secondary, "isPrimary:", isPrimary)
  return (
    <>
      <h2>CELLxGENE Census Cell-Tissue Counts</h2>
      <p>
        <select
          value={census}
          onChange={e => setCensus(e.target.value as Census)}
        >{
          CensusVersions.map(v => <option key={v} value={v}>{v}</option>)
        }</select> census,
        <select
          value={species}
          onChange={e => setSpecies(e.target.value as Species)}
        >{
          Species.map(v => <option key={v} value={v}>{unsnake(v)}</option>)
        }</select>
        <select value={isPrimaryStr} onChange={e => setIsPrimary(e.target.value === 'All' ? null : e.target.value === 'Primary')
        }>
          <option value={"All"}>All</option>
          <option value={"Primary"}>Primary only</option>
          <option value={"Secondary"}>Secondary only</option>
        </select>
        {/*<label>*/}
        {/*  <input type={"checkbox"} checked={primary} onChange={e => {*/}
        {/*    const primary = e.target.checked*/}
        {/*    console.log("setting primary:", primary)*/}
        {/*    setIsPrimary(primary && secondary ? null : primary)*/}
        {/*  }}/>*/}
        {/*  Primary*/}
        {/*</label>*/}
        {/*<label>*/}
        {/*  <input type={"checkbox"} checked={secondary} onChange={e => {*/}
        {/*    const secondary = e.target.checked*/}
        {/*    console.log("setting secondary:", secondary)*/}
        {/*    setIsPrimary(primary && secondary ? null : secondary)*/}
        {/*  }}/>*/}
        {/*  Secondary*/}
        {/*</label>*/}
      </p>
      <p>{totalCells} total cells</p>
      <div>
        <Plot
          data={[
            {
              type: 'bar',
              x: nCells,
              y: hist.map(({ tissue }) => tissue),
              text: hist.map(({ n_cells }) => humanize(n_cells)),
              textposition: 'outside',
              orientation: 'h',
              marker: {
                color: 'blue',
              }
            },
          ]}
          layout={{
            height: 900,
            width: 600,
            margin: { l: 145, t: 10, b: 30, r: 10 },
            xaxis: {
              type: 'log',
              tickformat: '.0s',
              range,
              title: { standoff: 20 },
            },
            yaxis: {
              dtick: 1,
              ticksuffix: ' ',
              tickfont: {
                size: 10,
              },
            },
            // title: { text: 'A Fancy Plot' },
          }}
          config={{
            displayModeBar: false,
          }}
        />
      </div>
      <p>

      </p>
    </>
  )
}

export default App
