export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// 浏览器只请求同源/api，凭据由HttpOnly会话Cookie持有。
export function createApiClient({ fetcher = globalThis.fetch, timeoutMs = 15000, onUnauthorized = () => {} } = {}) {
  let csrf = null
  let csrfLoading = null
  async function send(method, path, { body, headers = {}, signal } = {}) {
    if (!path.startsWith('/api/') || path.includes('://')) throw new Error('接口须使用同源/api路径')
    const timeout = new AbortController()
    const timer = setTimeout(() => timeout.abort(), timeoutMs)
    const abort = () => timeout.abort()
    if (signal?.aborted) timeout.abort()
    signal?.addEventListener('abort', abort, { once: true })
    try {
      const response = await fetcher(path, { method, headers, body, credentials: 'same-origin', redirect: 'error', signal: timeout.signal })
      let data = null
      let hasBody = false
      if (response.status !== 204) {
        const text = await response.text()
        hasBody = text.trim().length > 0
        if (hasBody) { try { data = JSON.parse(text) } catch { /* HTML代理错误不能直接显示原文。 */ } }
      }
      if (!response.ok) {
        if (response.status === 401) { csrf = null; onUnauthorized() }
        const message = response.status === 401 ? (path === '/api/auth/login' ? '账号或密码不正确。' : '登录已失效，请重新登录。')
          : response.status === 403 ? '安全校验未通过，请重新登录后再试。'
            : typeof data?.message === 'string' ? data.message : '服务暂不可用，请稍后重试。'
        throw new ApiError(message, { status: response.status, code: typeof data?.code === 'string' ? data.code : 'HTTP_ERROR' })
      }
      if (hasBody && data === null) throw new ApiError('服务返回格式不正确，请稍后重试。', { code: 'INVALID_RESPONSE' })
      return data
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(timeout.signal.aborted ? '请求已中断或超时，保存结果可能尚未确认，请使用原操作重试。' : '暂时连接不到服务，请稍后重试。')
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort) }
  }
  async function getCsrf() {
    if (csrf) return csrf
    if (!csrfLoading) {
      csrfLoading = send('GET', '/api/auth/csrf').then(data => {
        if (data?.headerName !== 'X-CSRF-TOKEN' || typeof data.token !== 'string' || !data.token) {
          throw new ApiError('安全校验信息无法读取。', { code: 'INVALID_RESPONSE' })
        }
        csrf = data
        return data
      }).finally(() => { csrfLoading = null })
    }
    return csrfLoading
  }
  async function request(method, path, { body, form = false, multipart = false, headers = {}, signal } = {}) {
    const outgoing = { ...headers }
    if (!['GET', 'HEAD'].includes(method)) {
      const token = await getCsrf()
      outgoing[token.headerName] = token.token
    }
    let content = body
    if (body !== undefined && !multipart) {
      outgoing['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json'
      content = form ? new URLSearchParams(body).toString() : JSON.stringify(body)
    }
    // 不自动重试写入；调用方保留同次确认的请求键与草稿。
    return send(method, path, { body: content, headers: outgoing, signal })
  }
  async function login(username, password) {
    await request('POST', '/api/auth/login', { body: { username, password }, form: true })
    csrf = null
    await getCsrf()
    return request('GET', '/api/auth/me')
  }
  async function logout() { await request('POST', '/api/auth/logout'); csrf = null }
  return { request, login, logout, getCsrf, resetCsrf: () => { csrf = null } }
}
