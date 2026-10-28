import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const OUT_DIR = process.env.OUT_DIR || 'database/seed/supabase'
const SQL_OUT = process.env.SQL_OUT || 'database/init/03-supabase-data.sql'
const SEED_ASSETS_DIR = process.env.SEED_ASSETS_DIR || 'backend/seed-assets'
const STORAGE_BUCKETS = (process.env.STORAGE_BUCKETS || 'imagens,transacoes,task-attachments')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar.')
  console.error('A service_role é necessária para exportar dados protegidos por RLS.')
  process.exit(1)
}

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Accept: 'application/json',
}

const TABLES = [
  ['user', 'id'],
  ['organograma', 'id'],
  ['atribuicao', 'id'],
  ['user_atribuicao', 'id'],
  ['user_permissoes', 'id'],
  ['curso', 'id'],
  ['user_curso', 'id'],
  ['transacao', 'id'],
  ['transacao_detalhe', 'id'],
  ['celula', 'id'],
  ['celula_user', 'id'],
  ['celula_relacao', 'id'],
  ['ind_grupo', 'id'],
  ['ind_subgrupo', 'id'],
  ['ind_indicador', 'id'],
  ['ind_valor', 'id'],
  ['ind_comentario', 'id'],
  ['ind_nota', 'id'],
  ['ind_nota_anexo', 'id'],
  ['ind_tarefa', 'id'],
  ['ind_tarefa_comentario', 'id'],
  ['ind_tarefa_anexo', 'id'],
]

const COLUMNS = {
  user: ['id', 'created_at', 'nome_usuario', 'cargo', 'foto', 'id_user', 'nivel', 'setor'],
  organograma: ['id', 'id_user', 'id_manager', 'pos_x', 'pos_y'],
  atribuicao: ['id', 'nome', 'cor'],
  user_atribuicao: ['id', 'id_user', 'id_atribuicao'],
  user_permissoes: ['id', 'id_user', 'organograma', 'transacoes', 'capacitacao', 'links', 'created_at'],
  curso: ['id', 'curso', 'descricao', 'conteudo', 'carga_horaria', 'categoria', 'nivel', 'ativo', 'link', 'created_at'],
  user_curso: ['id', 'id_user', 'id_curso', 'status'],
  transacao: ['id', 'transacao', 'modulo', 'descricao', 'id_ponto_focal', 'created_at'],
  transacao_detalhe: ['id', 'id_transacao', 'tipo', 'conteudo', 'ordem', 'created_at'],
  celula: ['id', 'nome', 'cor', 'descricao', 'pos_x', 'pos_y'],
  celula_user: ['id', 'id_celula', 'id_user'],
  celula_relacao: ['id', 'id_origem', 'id_destino'],
  ind_grupo: ['id', 'nome', 'descricao', 'ordem', 'criado_em'],
  ind_subgrupo: ['id', 'id_grupo', 'nome', 'responsavel_id', 'ordem', 'criado_em'],
  ind_indicador: ['id', 'id_subgrupo', 'nome', 'tipo', 'tipo_grafico', 'cor_grafico', 'painel_grafico', 'ordem', 'criado_em'],
  ind_valor: ['id', 'id_indicador', 'ano', 'mes', 'valor', 'atualizado_em', 'atualizado_por'],
  ind_comentario: ['id', 'id_valor', 'texto', 'autor_id', 'imagem_url', 'criado_em'],
  ind_nota: ['id', 'referencia', 'id_grupo', 'id_subgrupo', 'titulo', 'conteudo_html', 'mes_ref', 'ano_ref', 'status', 'autor_id', 'criado_em', 'atualizado_em'],
  ind_nota_anexo: ['id', 'id_nota', 'nome', 'url', 'tipo', 'criado_em'],
  ind_tarefa: ['id', 'titulo', 'descricao', 'id_grupo', 'id_subgrupo', 'id_indicador', 'mes_ref', 'ano_ref', 'responsavel_id', 'criado_por', 'data_inicio', 'data_fim', 'status', 'criado_em', 'atualizado_em'],
  ind_tarefa_comentario: ['id', 'id_tarefa', 'texto', 'autor_id', 'criado_em'],
  ind_tarefa_anexo: ['id', 'id_tarefa', 'nome', 'url', 'tipo', 'criado_em'],
}

const log = (...args) => console.log(...args)
const warn = (...args) => console.warn(...args)

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let body = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return { response, body }
}

async function exportTable(table) {
  const rows = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}`
    const { response, body } = await fetchJson(url, { headers: HEADERS })

    if (response.status === 404) {
      warn(`- ${table}: tabela não existe no Supabase, ignorando`)
      return { rows: [], missing: true }
    }
    if (!response.ok) {
      throw new Error(`${table}: ${response.status} ${JSON.stringify(body)}`)
    }
    if (!Array.isArray(body)) {
      throw new Error(`${table}: resposta inesperada do PostgREST`)
    }

    rows.push(...body)
    if (body.length < pageSize) break
    offset += pageSize
  }

  log(`- ${table}: ${rows.length} registro(s)`)
  return { rows, missing: false }
}

async function exportAuthUsers() {
  const users = []
  let page = 1
  const perPage = 1000

  while (true) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`
    const { response, body } = await fetchJson(url, { headers: HEADERS })
    if (!response.ok) {
      warn(`- auth.users: não foi possível exportar (${response.status}); e-mails não serão migrados`)
      return []
    }

    const batch = Array.isArray(body?.users) ? body.users : []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
  }

  log(`- auth.users: ${users.length} conta(s) de login`)
  return users
}

function decodePath(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function localizeStorageUrl(value) {
  if (typeof value === 'string') {
    return value.replace(
      /https?:\/\/[^/]+\/storage\/v1\/object\/(?:sign|public)\/([^/]+)\/([^?"#]+)(?:\?[^"'\s<>]*)?/gi,
      (_full, bucket, objectPath) => `/api/storage/public/${bucket}/${decodePath(objectPath)}`
    )
  }
  if (Array.isArray(value)) return value.map(localizeStorageUrl)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, child] of Object.entries(value)) out[key] = localizeStorageUrl(child)
    return out
  }
  return value
}

async function listBucketObjects(bucket, prefix = '', seen = new Set()) {
  const results = []
  let offset = 0
  const limit = 100

  while (true) {
    const url = `${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(bucket)}`
    const { response, body } = await fetchJson(url, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit, offset }),
    })

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) return results
      throw new Error(`storage ${bucket}: ${response.status} ${JSON.stringify(body)}`)
    }
    if (!Array.isArray(body)) return results

    for (const item of body) {
      if (!item?.name) continue
      const fullPath = prefix ? `${prefix}${item.name}` : item.name
      const isFolder = !item.id && (!item.metadata || Object.keys(item.metadata || {}).length === 0)
      if (isFolder) {
        const childPrefix = fullPath.endsWith('/') ? fullPath : `${fullPath}/`
        if (!seen.has(childPrefix)) {
          seen.add(childPrefix)
          results.push(...(await listBucketObjects(bucket, childPrefix, seen)))
        }
      } else {
        results.push({ bucket, path: fullPath })
      }
    }

    if (body.length < limit) break
    offset += limit
  }

  return results
}

async function exportStorage() {
  let buckets = []
  const bucketResponse = await fetchJson(`${SUPABASE_URL}/storage/v1/bucket`, { headers: HEADERS })
  if (bucketResponse.response.ok && Array.isArray(bucketResponse.body)) {
    buckets = bucketResponse.body.map((bucket) => bucket.name || bucket.id).filter(Boolean)
  } else {
    warn(`- storage: não foi possível listar buckets (${bucketResponse.response.status}); tentando buckets conhecidos`)
    buckets = STORAGE_BUCKETS
  }

  const known = new Set([...buckets, ...STORAGE_BUCKETS])
  let downloaded = 0

  for (const bucket of known) {
    let objects = []
    try {
      objects = await listBucketObjects(bucket)
    } catch (error) {
      warn(`- storage/${bucket}: ${error.message}`)
      continue
    }

    for (const object of objects) {
      const encodedPath = object.path
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')
      const url = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`
      const response = await fetch(url, { headers: HEADERS })
      if (!response.ok) {
        warn(`- storage/${bucket}/${object.path}: ${response.status}`)
        continue
      }
      const buffer = Buffer.from(await response.arrayBuffer())
      const target = path.join(SEED_ASSETS_DIR, bucket, object.path)
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, buffer)
      downloaded += 1
    }
    if (objects.length) log(`- storage/${bucket}: ${objects.length} objeto(s)`)
  }

  log(`- storage: ${downloaded} arquivo(s) baixado(s) para ${SEED_ASSETS_DIR}`)
}

function sqlIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  return `'${String(value).replace(/'/g, "''")}'`
}

const CONFLICT_TARGETS = {
  user_permissoes: 'id_user',
  user_curso: 'id_user, id_curso',
  user_atribuicao: 'id_user, id_atribuicao',
  celula_user: 'id_celula, id_user',
}

function tableStatements(table, rows) {
  if (!rows.length) return ''
  const allowed = COLUMNS[table]
  const columns = allowed || [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const insertColumns = columns.map(sqlIdentifier).join(', ')
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${sqlIdentifier(column)} = EXCLUDED.${sqlIdentifier(column)}`)
    .join(', ')
  const target = CONFLICT_TARGETS[table] || (columns.includes('id') ? 'id' : null)
  const conflict = target
    ? `ON CONFLICT (${target}) DO UPDATE SET ${updates}`
    : 'ON CONFLICT DO NOTHING'

  const chunks = []
  const chunkSize = 150
  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize)
    const values = chunk
      .map((row) => `(${columns.map((column) => sqlValue(row[column])).join(', ')})`)
      .join(',\n  ')
    chunks.push(
      `INSERT INTO public.${sqlIdentifier(table)} (${insertColumns}) VALUES\n  ${values}\n${conflict};`
    )
  }
  return chunks.join('\n\n')
}

function sequenceStatements(table) {
  return `SELECT setval(pg_get_serial_sequence('public.${sqlIdentifier(table)}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.${sqlIdentifier(table)}), 1));`
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const exportData = {}

  log('Exportando tabelas públicas...')
  for (const [table] of TABLES) {
    try {
      const result = await exportTable(table)
      if (!result.missing) {
        if (table === 'user') {
          for (const row of result.rows) {
            for (const field of ['nome_usuario', 'cargo', 'setor']) {
              if (typeof row[field] === 'string') row[field] = row[field].trim()
            }
          }
        }
        exportData[table] = result.rows.map(localizeStorageUrl)
        await fs.writeFile(
          path.join(OUT_DIR, `${table}.json`),
          JSON.stringify(exportData[table], null, 2),
          'utf8'
        )
      }
    } catch (error) {
      warn(`- ${table}: ${error.message}`)
      exportData[table] = []
    }
  }

  const authUsers = await exportAuthUsers()
  await fs.writeFile(path.join(OUT_DIR, 'auth-users.json'), JSON.stringify(authUsers, null, 2), 'utf8')

  log('Baixando arquivos do Storage...')
  try {
    await exportStorage()
  } catch (error) {
    warn(`- storage: ${error.message}`)
  }

  const users = exportData.user || []
  for (const user of users) {
    if (!user.id_user) {
      user.id_user = crypto.randomUUID()
      warn(`- user ${user.id || user.nome_usuario}: id_user ausente, UUID gerado`)
    }
  }

  const statements = ['BEGIN;']
  for (const [table] of TABLES) {
    const rows = exportData[table] || []
    if (!rows.length) continue
    statements.push(`-- ${table}: ${rows.length} registro(s)`)
    statements.push(tableStatements(table, rows))
    statements.push(sequenceStatements(table))
  }

  const authById = new Map(authUsers.map((user) => [user.id, user]))
  const accountUpdates = []
  for (const user of users) {
    const authUser = authById.get(user.id_user)
    if (!authUser?.email) continue
    const hash =
      typeof authUser.encrypted_password === 'string' && /^\$2[aby]\$/.test(authUser.encrypted_password)
        ? authUser.encrypted_password
        : null
    const email = authUser.email
    const displayName = user.nome_usuario || authUser.email
    const setHash = hash ? `, password_hash = ${sqlValue(hash)}` : ''
    accountUpdates.push(
      `UPDATE public.app_auth SET email = ${sqlValue(email)}, display_name = ${sqlValue(displayName)}${setHash} WHERE id_user = ${sqlValue(user.id_user)}::uuid AND username <> 'admin' AND NOT EXISTS (SELECT 1 FROM public.app_auth other WHERE other.email IS NOT NULL AND lower(other.email) = lower(${sqlValue(email)}) AND other.id_user <> ${sqlValue(user.id_user)}::uuid);`
    )
  }
  if (accountUpdates.length) {
    statements.push('-- e-mails de login vindos do Supabase Auth')
    statements.push(...accountUpdates)
  }

  statements.push('COMMIT;')

  const header = [
    '-- Gerado por scripts/export-supabase-data.mjs',
    `-- Origem: ${SUPABASE_URL}`,
    `-- Data: ${new Date().toISOString()}`,
    '-- Este arquivo contém dados reais. Não versionar.',
    '',
  ].join('\n')
  await fs.writeFile(SQL_OUT, `${header}${statements.join('\n\n')}\n`, 'utf8')

  const total = Object.values(exportData).reduce((sum, rows) => sum + rows.length, 0)
  log('')
  log(`Concluído: ${total} registro(s) exportado(s).`)
  log(`SQL: ${SQL_OUT}`)
  log(`JSON: ${OUT_DIR}`)
  log(`Storage: ${SEED_ASSETS_DIR}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
