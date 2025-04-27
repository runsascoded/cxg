import './App.css'
import censusData from '../public/census_tissue_hist.json'
import Plot from 'react-plotly.js'
import { useMemo, useState } from "react";
const { log10, min, max } = Math

export type Species = 'homo_sapiens' | 'mus_musculus'
export type Census = '2023-05-15' | '2024-07-01' | '2025-01-30'

function humanize(num: number): string {
  if (num >= 1e6) {
    return `${(num / 1e6).toPrecision(3)}M`
  } else if (num >= 1e3) {
    return `${(num / 1e3).toPrecision(3)}k`
  } else {
    return `${num}`
  }
}

function App() {
  const [ species, setSpecies ] = useState<Species>('homo_sapiens')
  const [ census, setCensus ] = useState<Census>('2025-01-30')
  const [ isPrimary, setIsPrimary ] = useState<boolean>(true)
  const { hist, nCells } = useMemo(
    () => {
      const hist = censusData.filter(
        o =>
          o.species === species &&
          o.census === census &&
          o.is_primary === isPrimary
      ).map(({ tissue, n_cells }) => ({
        tissue: tissue.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        n_cells,
      }))
      hist.sort((a, b) => a.n_cells - b.n_cells)
      const nCells = hist.map(({ n_cells }) => n_cells)
      return { hist, nCells }
    },
    [species, census]
  )
  const range = [log10(nCells.reduce((a, b) => min(a, b))) - .4, log10(nCells.reduce((a, b) => max(a, b), 0)) + .5]
  // console.log(censusData)
  return (
    <>
      <h2>CELLxGENE Census Cell-Tissue Counts</h2>
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
            height: 1000,
            width: 600,
            margin: { l: 165, t: 10, b: 30, r: 10 },
            xaxis: {
              type: 'log',
              tickformat: '.0s',
              range,
              title: { standoff: 20 },
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
