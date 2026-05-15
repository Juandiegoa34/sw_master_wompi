export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('57') ? digits : `57${digits}`
  return `https://wa.me/${normalized}`
}
