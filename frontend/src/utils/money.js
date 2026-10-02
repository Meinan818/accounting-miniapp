// All new amounts are validated and calculated in integer cents.
export const MAX_CENTS = 99_999_999_999

export function parseCents(value) {
  const text = String(value ?? '').trim()
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('金额请填写大于0的数字，最多两位小数；千分位格式如1,200.50')
  }
  const [whole, fraction = ''] = text.replaceAll(',', '').split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) {
    throw new Error('金额须大于0且不超过999,999,999.99元')
  }
  return cents
}

export function centsText(cents) {
  if (!Number.isSafeInteger(cents)) throw new Error('金额计算无效')
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return sign + Math.floor(abs / 100) + '.' + String(abs % 100).padStart(2, '0')
}

export function legacyCents(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export function sumAmounts(records, type) {
  return records.filter(r => !type || r.type === type).reduce((sum, r) => sum + legacyCents(r.amount), 0) / 100
}
