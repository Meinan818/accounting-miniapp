export function fromProfileView(value, owner) {
  if (!value || typeof value.nickname !== 'string' || typeof value.signature !== 'string'
    || !['cat', 'paw', 'flower', 'photo'].includes(value.avatar) || !Number.isSafeInteger(value.version) || value.version < 0
    || (value.avatar === 'photo' && value.avatarUrl !== '/api/profile/avatar')) throw new Error('账号资料格式不正确')
  return { nickname: value.nickname, signature: value.signature, avatar: value.avatar, version: value.version,
    ...(value.avatar === 'photo' ? { photo: `${value.avatarUrl}?v=${value.version}${owner ? '&expectedAccount=' + encodeURIComponent(owner) : ''}` } : {}) }
}
export function createProfileApi(client, { owner } = {}) {
  async function read() { return fromProfileView(await client.request('GET', '/api/profile'), owner) }
  async function save(current, form) {
    const nickname = form.nickname.trim(), signature = form.signature.trim()
    if (!nickname || [...nickname].length > 20 || [...signature].length > 60 || !['cat', 'paw', 'flower', 'photo'].includes(form.avatar)) {
      throw new Error('昵称须为1–20个字，签名最多60个字，请选择有效头像。')
    }
    let version = current.version, uploaded = false
    if (form.avatar === 'photo' && form.photo?.startsWith('data:image/jpeg;base64,')) {
      const encoded = form.photo.slice('data:image/jpeg;base64,'.length)
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length > 3 * 1024 * 1024) throw new Error('照片数据不合法')
      const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
      const body = new FormData(); body.append('image', new Blob([bytes], { type: 'image/jpeg' }), 'avatar.jpg')
      const photo = fromProfileView(await client.request('POST', `/api/profile/avatar?version=${version}`, { body, multipart: true }), owner)
      version = photo.version; uploaded = true
    }
    try { return fromProfileView(await client.request('PUT', '/api/profile', { body: { version, nickname, signature, avatar: form.avatar } }), owner) }
    catch (failure) {
      if (uploaded) throw new Error('照片已保存，但昵称或签名尚未保存。' + failure.message + ' 请重新核对后再试。')
      throw failure
    }
  }
  return { read, save }
}
