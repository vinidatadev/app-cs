const SESSION_KEY = 'organograma.session.v1'

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const REST_BASE = (import.meta.env.VITE_REST_URL || '/rest/v1').replace(/\/$/, '')

const withOrigin = (base) => (base.startsWith('http') ? base : `${ORIGIN}${base}`)
const API_URL = withOrigin(API_BASE)
const REST_URL = withOrigin(REST_BASE)

let session = loadSession()
const listeners = new Set()

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(next) {
  session = next
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* localStorage indisponível */
  }
}

function emit(event) {
  listeners.forEach((listener) => {
    try {
      listener(event, session)
    } catch {
      /* listener isolado */
    }
  })
}

function authHeader() {
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function httpError(payload, status) {
  if (payload && typeof payload === 'object' && (payload.message || payload.detail)) {
    return {
      message: payload.message || payload.detail,
      details: payload.details || null,
      hint: payload.hint || null,
      code: payload.code || String(status),
    }
  }
  return {
    message: typeof payload === 'string' && payload ? payload : `Erro HTTP ${status}`,
    details: null,
    hint: null,
    code: String(status),
  }
}

function filterValue(value) {
  if (value === null) return 'is.null'
  if (value === true) return 'eq.true'
  if (value === false) return 'eq.false'
  return `eq.${value}`
}

function inValues(values) {
  return `in.(${values
    .map((value) => {
      if (value === null) return 'null'
      if (typeof value === 'string' && /[",()]/.test(value)) {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
      }
      return String(value)
    })
    .join(',')})`
}

class QueryBuilder {
  constructor(table) {
    this.table = table
    this.params = new URLSearchParams()
    this.method = 'GET'
    this.body = null
    this.singular = null
    this.returning = false
    this.upsertMode = false
    this.onConflict = null
  }

  select(columns = '*') {
    this.params.set('select', String(columns).replace(/\s+/g, ' ').trim())
    this.returning = true
    return this
  }

  eq(column, value) {
    this.params.append(column, filterValue(value))
    return this
  }

  in(column, values) {
    this.params.append(column, inValues(Array.isArray(values) ? values : []))
    return this
  }

  order(column, options = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc'
    this.params.append('order', `${column}.${direction}`)
    return this
  }

  limit(count) {
    this.params.set('limit', String(count))
    return this
  }

  single() {
    this.singular = 'single'
    return this
  }

  maybeSingle() {
    this.singular = 'maybeSingle'
    return this
  }

  insert(values) {
    this.method = 'POST'
    this.body = values
    return this
  }

  update(values) {
    this.method = 'PATCH'
    this.body = values
    return this
  }

  upsert(values, options = {}) {
    this.method = 'POST'
    this.body = values
    this.upsertMode = true
    this.onConflict = options.onConflict || null
    return this
  }

  delete() {
    this.method = 'DELETE'
    return this
  }

  async execute() {
    const params = new URLSearchParams(this.params)
    if (this.onConflict) params.set('on_conflict', this.onConflict)

    const headers = { Accept: 'application/json', ...authHeader() }
    if (this.body !== null) headers['Content-Type'] = 'application/json'

    if (this.method !== 'GET') {
      const prefer = [this.returning ? 'return=representation' : 'return=minimal']
      if (this.upsertMode) prefer.push('resolution=merge-duplicates')
      headers.Prefer = prefer.join(',')
    }

    let response
    try {
      response = await fetch(`${REST_URL}/${this.table}?${params.toString()}`, {
        method: this.method,
        headers,
        body: this.body !== null ? JSON.stringify(this.body) : undefined,
      })
    } catch (error) {
      return { data: null, error: httpError(error.message, 0) }
    }

    const text = await response.text()
    let payload = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }

    if (!response.ok) {
      return { data: null, error: httpError(payload, response.status) }
    }

    if (response.status === 204 || payload === null) {
      return { data: null, error: null }
    }

    let data = payload
    if (this.singular) {
      if (Array.isArray(data)) {
        if (this.singular === 'single') {
          if (data.length !== 1) {
            return {
              data: null,
              error: {
                message:
                  data.length === 0
                    ? 'Nenhum registro encontrado'
                    : 'Mais de um registro encontrado',
                details: null,
                hint: null,
                code: 'PGRST116',
              },
            }
          }
          data = data[0]
        } else {
          data = data[0] ?? null
        }
      }
    }

    return { data, error: null }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  catch(reject) {
    return this.execute().catch(reject)
  }
}

async function signInWithPassword({ email, password }) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: email, password }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return { data: { user: null, session: null }, error: httpError(payload, response.status) }
    }

    const next = {
      access_token: payload.access_token,
      token_type: payload.token_type || 'bearer',
      expires_in: payload.expires_in,
      user: {
        id: payload.user.id,
        email: payload.user.email,
        user_metadata: {
          name: payload.user.name || payload.user.nome_usuario,
          username: payload.user.username,
        },
      },
    }
    saveSession(next)
    emit('SIGNED_IN')
    return { data: { user: next.user, session: next }, error: null }
  } catch (error) {
    return {
      data: { user: null, session: null },
      error: httpError(error.message, 0),
    }
  }
}

async function getSession() {
  if (!session) return { data: { session: null }, error: null }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Accept: 'application/json', ...authHeader() },
    })
    if (response.status === 401) {
      saveSession(null)
      return { data: { session: null }, error: null }
    }
    if (response.ok) {
      const payload = await response.json()
      saveSession({
        ...session,
        user: {
          ...session.user,
          id: payload.user.id,
          email: payload.user.email,
          user_metadata: {
            ...session.user?.user_metadata,
            name: payload.user.name,
            username: payload.user.username,
          },
        },
      })
    }
  } catch {
    /* mantém a sessão local quando a API está temporariamente indisponível */
  }

  return { data: { session }, error: null }
}

async function signOut() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...authHeader() },
    })
  } catch {
    /* logout local mesmo sem rede */
  }
  saveSession(null)
  emit('SIGNED_OUT')
  return { error: null }
}

function onAuthStateChange(callback) {
  listeners.add(callback)
  return {
    data: {
      subscription: {
        unsubscribe: () => listeners.delete(callback),
      },
    },
  }
}

function storageFrom(bucket) {
  return {
    async upload(path, file) {
      const encodedPath = String(path)
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')
      const form = new FormData()
      form.append('file', file, file?.name || 'arquivo')

      try {
        const response = await fetch(
          `${API_URL}/storage/${encodeURIComponent(bucket)}/${encodedPath}`,
          {
            method: 'POST',
            headers: authHeader(),
            body: form,
          }
        )
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          return { data: null, error: httpError(payload, response.status) }
        }
        return {
          data: {
            path: payload?.path || path,
            fullPath: payload?.fullPath || `${bucket}/${path}`,
          },
          error: null,
        }
      } catch (error) {
        return { data: null, error: httpError(error.message, 0) }
      }
    },

    getPublicUrl(path) {
      const encodedPath = String(path)
        .split('/')
        .map((part) => encodeURIComponent(part))
        .join('/')
      return {
        data: {
          publicUrl: `${API_URL}/storage/public/${encodeURIComponent(bucket)}/${encodedPath}`,
        },
      }
    },
  }
}

export const api = {
  from(table) {
    return new QueryBuilder(table)
  },
  auth: {
    signInWithPassword,
    getSession,
    signOut,
    onAuthStateChange,
  },
  storage: {
    from: storageFrom,
  },
}
