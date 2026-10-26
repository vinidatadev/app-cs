import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'
import { formatNumeroBR } from '../../utils/numeros'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

function yAxisId(ind) {
  return ind.tipo === 'percentual' ? 'right' : 'left'
}

function BarLabel({ x, y, width, value, tipo }) {
  if (value === null || value === undefined) return null
  const text = tipo === 'percentual'
    ? formatNumeroBR(value, { percentual: true })
    : Number(value).toLocaleString('pt-BR')
  return (
    <text
      x={x + width / 2} y={y - 5}
      textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={600}
    >{text}</text>
  )
}

function LineDot({ cx, cy, value, cor, tipo }) {
  if (value === null || value === undefined) return null
  const text = tipo === 'percentual' ? formatNumeroBR(value, { percentual: true }) : Number(value).toLocaleString('pt-BR')
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={cor} stroke="#0f0f17" strokeWidth={1.5} />
      <text
        x={cx} y={cy - 10}
        textAnchor="middle" fontSize={10} fill={cor} fontWeight={700}
      >{text}</text>
    </g>
  )
}

export default function GraficoSubgrupo({ subgrupo, valores, ano }) {
  const comGrafico = (subgrupo.ind_indicador || []).filter(i => i.tipo_grafico)
  if (comGrafico.length === 0) return null

  const paineis = [1, 2]
    .map(p => ({
      painel: p,
      indicadores: comGrafico.filter(i => (Number(i.painel_grafico) || 1) === p),
    }))
    .filter(p => p.indicadores.length > 0)

  if (paineis.length === 0) return null

  return (
    <>
      {paineis.map(p => (
        <GraficoPainel
          key={p.painel}
          subgrupo={subgrupo}
          indicadores={p.indicadores}
          valores={valores}
          painel={p.painel}
          mostrarPainel={paineis.length > 1}
        />
      ))}
    </>
  )
}

function GraficoPainel({ subgrupo, indicadores, valores, painel, mostrarPainel }) {
  const temNumero = indicadores.some(i => i.tipo !== 'percentual')
  const temPercentual = indicadores.some(i => i.tipo === 'percentual')

  const data = MESES.map((mes, idx) => {
    const mesNum = idx + 1
    const ponto = { mes }
    indicadores.forEach(ind => {
      const row = valores[ind.id]?.[mesNum]
      ponto[ind.nome] = row?.valor ?? null
    })
    return ponto
  })

  const dataFiltrada = data.filter(d => indicadores.some(ind => d[ind.nome] !== null))
  if (dataFiltrada.length === 0) return null

  const numValues = indicadores
    .filter(i => i.tipo !== 'percentual')
    .flatMap(ind => dataFiltrada.map(d => d[ind.nome]).filter(v => v !== null))

  const maxNum = numValues.length > 0 ? Math.max(...numValues) : 100
  const leftDomain = [0, Math.ceil(maxNum * 1.15)]

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 16px 8px', marginBottom: 16,
    }}>
      <div style={{
        fontSize: 14, fontWeight: 800, color: 'var(--text2)',
        marginBottom: 20, textAlign: 'center', letterSpacing: '0.04em',
      }}>
        {subgrupo.nome.toUpperCase()}
        {mostrarPainel && (
          <span style={{
            marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#6366f1',
            background: '#6366f122', borderRadius: 4, padding: '2px 7px',
            letterSpacing: '0.06em', verticalAlign: 'middle',
          }}>GRÁFICO {painel}</span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dataFiltrada} margin={{ top: 24, right: temPercentual ? 48 : 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: 'var(--text4)' }}
            axisLine={false} tickLine={false}
          />

          {temNumero && (
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={leftDomain}
              tick={{ fontSize: 10, fill: 'var(--text5)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => {
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
                return v
              }}
              width={40}
            />
          )}

          {temPercentual && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 10, fill: 'var(--text5)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
              width={36}
            />
          )}

          {!temNumero && temPercentual && (
            <YAxis
              yAxisId="left"
              orientation="left"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{ fontSize: 10, fill: 'var(--text5)' }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
              width={36}
            />
          )}

          <Tooltip
            contentStyle={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 12,
            }}
            formatter={(value, name) => {
              const ind = indicadores.find(i => i.nome === name)
              if (!ind || value === null) return ['-', name]
              const fmt = ind.tipo === 'percentual'
                ? formatNumeroBR(value, { percentual: true })
                : Number(value).toLocaleString('pt-BR')
              return [fmt, name]
            }}
          />

          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(value) => (
              <span style={{ color: 'var(--text3)' }}>{value}</span>
            )}
          />

          {indicadores.map(ind => {
            const axis = !temNumero ? 'left' : yAxisId(ind)
            const cor = ind.cor_grafico || '#6366f1'

            if (ind.tipo_grafico === 'barra') {
              return (
                <Bar
                  key={ind.id}
                  yAxisId={axis}
                  dataKey={ind.nome}
                  fill={cor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={56}
                >
                  <LabelList
                    dataKey={ind.nome}
                    content={({ x, y, width, value }) =>
                      <BarLabel x={x} y={y} width={width} value={value} tipo={ind.tipo} />
                    }
                  />
                </Bar>
              )
            }

            if (ind.tipo_grafico === 'linha') {
              return (
                <Line
                  key={ind.id}
                  yAxisId={axis}
                  dataKey={ind.nome}
                  type="monotone"
                  stroke={cor}
                  strokeWidth={2.5}
                  dot={({ cx, cy, value }) =>
                    <LineDot key={`${cx}-${cy}`} cx={cx} cy={cy} value={value} cor={cor} tipo={ind.tipo} />
                  }
                  activeDot={{ r: 6, fill: cor }}
                />
              )
            }

            return null
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
