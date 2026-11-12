import { products } from '../../src/catalog.js'

const singleLineControls = /[\u0000-\u001f\u007f]/
const multilineControls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const cities = new Map([
  ['lagos', 'Lagos'],
  ['abuja', 'Abuja'],
  ['port harcourt', 'Port Harcourt'],
  ['port-harcourt', 'Port Harcourt'],
  ['ph', 'Port Harcourt'],
])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function textField(value, label, { required = false, max = 500, multiline = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new Error(`${label} is required.`)
    return ''
  }
  if (typeof value !== 'string') throw new Error(`${label} must be text.`)
  if (value.length > max) throw new Error(`${label} is too long.`)
  if ((multiline ? multilineControls : singleLineControls).test(value)) {
    throw new Error(`${label} contains invalid characters.`)
  }
  const trimmed = value.trim()
  if (required && !trimmed) throw new Error(`${label} is required.`)
  return trimmed
}

function phoneField(value, label, required = false) {
  const phone = textField(value, label, { required, max: 30 })
  if (phone && (!/^\+?[\d ().-]+$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, '')))) {
    throw new Error(`Please enter a valid ${label.toLowerCase()}.`)
  }
  return phone
}

export function validateCheckoutPayload(payload) {
  if (!isRecord(payload) || !isRecord(payload.customer) || !isRecord(payload.delivery)) {
    throw new Error('Customer and delivery details must be objects.')
  }

  const customer = {
    fullName: textField(payload.customer.fullName, 'Name', { required: true, max: 200 }),
    email: textField(payload.customer.email, 'Email', { required: true, max: 254 }),
    phone: phoneField(payload.customer.phone, 'Phone number', true),
    recipientName: textField(payload.customer.recipientName, 'Recipient name', { max: 200 }),
    recipientPhone: phoneField(payload.customer.recipientPhone, 'Recipient phone number'),
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Error('Please enter a valid email address.')

  const method = payload.delivery.method === undefined ? 'delivery' : payload.delivery.method
  if (method !== 'delivery' && method !== 'pickup') throw new Error('Please choose delivery or pickup.')
  const cityInput = textField(payload.delivery.city, 'City', { required: true, max: 50 })
  const city = cities.get(cityInput.toLowerCase().replace(/\s+/g, ' '))
  if (!city) throw new Error('Please choose Lagos, Abuja or Port Harcourt.')
  const delivery = {
    method,
    city,
    area: textField(payload.delivery.area, 'Delivery area', { required: method !== 'pickup' }),
    address: textField(payload.delivery.address, 'Delivery address', { required: method !== 'pickup' }),
    deliveryDate: textField(payload.delivery.deliveryDate, 'Preferred date', { required: true, max: 10 }),
    deliveryTime: textField(payload.delivery.deliveryTime, 'Preferred time', { required: true, max: 5 }),
    cardMessage: textField(payload.delivery.cardMessage, 'Card message', { multiline: true }),
    deliveryNotes: textField(payload.delivery.deliveryNotes, 'Delivery notes', { multiline: true }),
  }
  const parsedDate = new Date(`${delivery.deliveryDate}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(delivery.deliveryDate) ||
    !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== delivery.deliveryDate) {
    throw new Error('Please choose a valid preferred date.')
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(delivery.deliveryTime)) {
    throw new Error('Please choose a valid preferred time.')
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 100) {
    throw new Error('Your cart must contain between 1 and 100 items.')
  }
  const items = payload.items.map(item => {
    if (!isRecord(item) || typeof item.id !== 'string') throw new Error('Invalid cart item.')
    const product = products.find(entry => entry.id === item.id)
    if (!product) throw new Error('A product in your cart is no longer available. Please update your cart.')
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
      throw new Error('Each item quantity must be a whole number between 1 and 100.')
    }
    const addOns = item.addOns === undefined ? [] : item.addOns
    if (!Array.isArray(addOns) || addOns.length > (product.addOns || []).length ||
      addOns.some(id => typeof id !== 'string') || new Set(addOns).size !== addOns.length) {
      throw new Error('Invalid product options. Please update your cart.')
    }
    const groups = new Set()
    for (const id of addOns) {
      const option = (product.addOns || []).find(entry => entry.id === id)
      if (!option || (option.group && groups.has(option.group))) {
        throw new Error('Invalid product options. Please update your cart.')
      }
      if (option.group) groups.add(option.group)
    }
    return { id: item.id, qty: item.qty, addOns: [...addOns] }
  })
  const discountCode = textField(payload.discountCode, 'Discount code', { max: 100 })
  return { customer, delivery, items, discountCode: discountCode || null }
}
