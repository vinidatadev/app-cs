import { useState } from 'react'
import Navbar from '../components/Navbar'

const POWER_BI = [
  {
    nome: 'Carteira OTIF',
    descricao: 'Acompanhamento de On Time In Full da carteira de pedidos',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/34aa937c-7ddf-48ec-8ba0-b1b98b2a67d0?experience=power-bi',
    icone: '📦',
    cor: '#f59e0b',
  },
  {
    nome: 'Carteira & Estoque GAC',
    descricao: 'Visão de carteira e estoque do setor GAC',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/e65395cd-e4ac-4873-be6a-32c309b5789f/ReportSection8d50aeebb4dcabb00840?experience=power-bi',
    icone: '🗂',
    cor: '#f59e0b',
  },
  {
    nome: 'Carteira Diário GAC',
    descricao: 'Acompanhamento diário da carteira GAC',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/05899b17-06d2-495b-8e73-da3e3b3ccddd/ReportSection8cf1029399ec138ce2ce?experience=power-bi',
    icone: '📅',
    cor: '#f59e0b',
  },
  {
    nome: 'Cancelamento',
    descricao: 'Relatório de cancelamentos de pedidos',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/b3706b2e-d917-4967-ba23-4f863f7c19f0/ReportSection?experience=power-bi',
    icone: '🚫',
    cor: '#f59e0b',
  },
  {
    nome: 'Produção COOIISPI',
    descricao: 'Indicadores de produção COOIISPI',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/d25b6b69-2906-4c0e-98dd-5fbe19298104/4144c746d8c34eb7fc6d?experience=power-bi',
    icone: '🏭',
    cor: '#f59e0b',
  },
  {
    nome: 'SZChat (relatório)',
    descricao: 'Relatório de atendimentos via SZChat',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/62836baa-cb55-47b6-8c6b-3e61902e6996/5e2bb9dae9787842d151?experience=power-bi',
    icone: '💬',
    cor: '#f59e0b',
  },
  {
    nome: 'Central de Atendimento',
    descricao: 'Dashboard da central de atendimento ao cliente',
    url: 'https://app.powerbi.com/groups/415e55ea-c94e-4402-b9ca-5ec9639c2a97/reports/bd5ae9b1-9432-4b07-9bea-c9c3d79d2ce3/5f238c3301d19d7dca26?experience=power-bi',
    icone: '🎧',
    cor: '#f59e0b',
  },
]

const OUTROS = [
  {
    nome: 'Service Desk',
    descricao: 'Portal de chamados e suporte de TI',
    url: 'https://www.cervelloesm.com.br/AcoCearense/Portal/Home',
    icone: '🛠',
    cor: '#6366f1',
  },
  {
    nome: 'SZChat (portal)',
    descricao: 'Acesso ao portal de atendimento SZChat',
    url: 'https://acocearense5.sz.chat/static/signin?action=session_expired',
    icone: '💬',
    cor: '#6366f1',
  },
  {
    nome: 'Portal PCP',
    descricao: 'Portal de Planejamento e Controle da Produção',
    url: 'http://atendimentopcp',
    icone: '📋',
    cor: '#6366f1',
  },
  {
    nome: 'WebMail',
    descricao: 'Acesso ao e-mail corporativo',
    url: 'https://webmail.acocearense.com.br/',
    icone: '✉️',
    cor: '#6366f1',
  },
  {
    nome: 'SAP Fiori',
    descricao: 'Portal SAP Fiori — cliente 300, idioma PT',
    url: 'https://s4p.sap.acocearense.com/sap/bc/ui2/flp?sap-client=300&sap-language=PT',
    icone: '⚙️',
    cor: '#6366f1',
  },
  {
    nome: 'Portal Gente Acontece',
    descricao: 'Portal de RH e benefícios',
    url: 'https://login.lg.com.br/login/genteacontece',
    icone: '👥',
    cor: '#6366f1',
  },
]

export default function Links() {
  return (
    <div className="page">
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px 64px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text2)', letterSpacing: '-0.03em' }}>Links Rápidos</h1>
          <p style={{ fontSize: 13, color: 'var(--text5)', marginTop: 4 }}>Acesso direto aos sistemas e relatórios do setor</p>
        </div>

        {/* Seção Power BI */}
        <Section
          titulo="Power BI"
          subtitulo="Relatórios e dashboards analíticos"
          icone="📊"
          cor="#f59e0b"
          links={POWER_BI}
        />

        {/* Seção Outros sistemas */}
        <Section
          titulo="Sistemas"
          subtitulo="Portais e ferramentas de uso diário"
          icone="🔗"
          cor="#6366f1"
          links={OUTROS}
        />
      </div>
    </div>
  )
}

function Section({ titulo, subtitulo, icone, cor, links }) {
  return (
    <div style={{ marginBottom: 52 }}>
      {/* Header da seção */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${cor}18`, border: `1px solid ${cor}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {icone}
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text2)', letterSpacing: '-0.01em' }}>{titulo}</h2>
          <p style={{ fontSize: 12, color: 'var(--text5)', marginTop: 1 }}>{subtitulo}</p>
        </div>
        <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 8 }} />
        <span style={{ fontSize: 11, color: 'var(--text5)', fontWeight: 600 }}>{links.length} links</span>
      </div>

      {/* Grid de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {links.map(link => <LinkCard key={link.nome} link={link} />)}
      </div>
    </div>
  )
}

function LinkCard({ link }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: hovered ? 'var(--bg3)' : 'var(--bg2)',
        border: `1px solid ${hovered ? link.cor + '55' : 'var(--border)'}`,
        borderRadius: 16, padding: '16px 18px',
        textDecoration: 'none', cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hovered ? `0 4px 20px ${link.cor}18` : 'none',
      }}
    >
      {/* Ícone */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${link.cor}15`, border: `1px solid ${link.cor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, transition: 'transform 0.15s',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
      }}>
        {link.icone}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text2)', marginBottom: 4, letterSpacing: '-0.01em' }}>
          {link.nome}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text4)', lineHeight: 1.5 }}>
          {link.descricao}
        </div>
      </div>

      {/* Seta */}
      <div style={{
        color: hovered ? link.cor : 'var(--border)',
        fontSize: 16, flexShrink: 0, marginTop: 2,
        transition: 'color 0.15s, transform 0.15s',
        transform: hovered ? 'translate(2px, -2px)' : 'none',
      }}>
        ↗
      </div>
    </a>
  )
}
