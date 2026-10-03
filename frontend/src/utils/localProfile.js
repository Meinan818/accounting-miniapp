export const LOCAL_PROFILE_KEY = 'miaoji_local_profile_v1'
export const PROFILE_AVATARS = ['cat', 'paw', 'flower']
export const DEFAULT_PROFILE = Object.freeze({ nickname: '记账的小伙伴', signature: '把日子过好，也把小账记好。', avatar: 'cat' })

export function validateLocalProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('本地资料格式不正确')
  if (typeof value.nickname !== 'string' || typeof value.signature !== 'string') throw new Error('昵称和签名需要填写文字')
  const nickname = value.nickname.trim()
  const signature = value.signature.trim()
  if (!nickname || [...nickname].length > 20) throw new Error('昵称请填写1–20个字')
  if ([...signature].length > 60) throw new Error('签名最多60个字')
  if (!PROFILE_AVATARS.includes(value.avatar)) throw new Error('请选择已有的头像贴纸')
  return { nickname, signature, avatar: value.avatar }
}

export function readLocalProfile(storage) {
  try {
    const snapshot = storage.getItem(LOCAL_PROFILE_KEY)
    if (snapshot === null) return { profile: { ...DEFAULT_PROFILE }, snapshot, error: '' }
    const stored = JSON.parse(snapshot)
    if (stored?.version !== 1) throw new Error('本地资料版本暂不支持')
    return { profile: validateLocalProfile(stored.profile), snapshot, error: '' }
  } catch (error) {
    return { profile: { ...DEFAULT_PROFILE }, snapshot: null, error: '本地资料暂时无法读取，原内容已保留。' + error.message }
  }
}

export function saveLocalProfile(storage, value, expectedSnapshot) {
  const profile = validateLocalProfile(value)
  if (storage.getItem(LOCAL_PROFILE_KEY) !== expectedSnapshot) throw new Error('另一页已更新资料，请关闭编辑并重新读取后再修改。')
  const snapshot = JSON.stringify({ version: 1, profile })
  storage.setItem(LOCAL_PROFILE_KEY, snapshot)
  return { profile, snapshot }
}
