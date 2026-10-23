import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList, Cell,
} from 'recharts'

const MESES = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']

// Indicadores de número vão pro eixo esquerdo
// Indicadores de percentual vão pro eixo direito (0-100 fixo)
function yAxisId(ind) {
  return ind.tipo === 'percentual' ? 'right' : 'left'
}

// Label inline nas barras
function BarLabel({ x, y, width, value, tipo }) {
  if (value === null || value === undefined) return null
  const text = tipo === 'percentual'
    ? `${Math.round(value)}%`
    : Number(value).toLocaleString('pt-BR')
  return (
    <text
      x={x + width / 2} y={y - 5}
      textAnchor="middle" fontSize={10} fill="#94a3b8" fontWeight={600}
    >{text}</text>
  )
}

// Dot customizado para linha — mostra o valor em cima
function LineDot({ cx, cy, value, cor, tipo }) {
  if (value === null || value === undefined) return null
  const text = tipo === 'percentual' ? `${Math.round(value)}%` : Number(value).toLocaleString('pt-BR')
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
  const indicadores = (subgrupo.ind_indicador || []).filter(i => i.tipo_grafico)
  if (indicadores.length === 0) return null

  const temNumero    = indicadores.some(i => i.tipo !== 'percentual')
  const temPercentual = indicadores.some(i => i.tipo === 'percentual')

  // Monta os dados por mês
  const data = MESES.map((mes, idx) => {
    const mesNum = idx + 1
    const ponto = { mes }
    indicadores.forEach(ind => {
      const row = valores[ind.id]?.[mesNum]
      ponto[ind.nome] = row?.valor ?? null
    })
    return ponto
  })

  // Só mostra meses com pelo menos um valor
  const dataFiltrada = data.filter(d => indicadores.some(ind => d[ind.nome] !== null))
  if (dataFiltrada.length === 0) return null

  // Calcula domínio do eixo esquerdo com 10% de folga no topo
  const numValues = indicadores
    .filter(i => i.tipo !== 'percentual')
    .flatMap(ind => dataFiltrada.map(d => d[ind.nome]).filter(v => v !== null))

  const maxNum = numValues.length > 0 ? Math.max(...numValues) : 100
  const leftDomain = [0, Math.ceil(maxNum * 1.15)] // 15% de espaço pro label

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
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={dataFiltrada} margin={{ top: 24, right: temPercentual ? 48 : 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />

          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: 'var(--text4)' }}
            axisLine={false} tickLine={false}
          />

          {/* Eixo esquerdo — valores numéricos (ex: QTD, VOLUME) */}
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

          {/* Eixo direito — percentual SEMPRE fixo 0–100 */}
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

          {/* Quando só tem percentual, usa eixo esquerdo como percentual */}
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
                ? `${Math.round(value)}%`
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

          {/* Renderiza cada indicador na série correta */}
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
