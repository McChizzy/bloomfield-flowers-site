const ABUJA_ZONES = [
  {
    fee: 3500,
    areas: [
      'maitama', 'asokoro', 'wuse 2', 'wuse ii', 'central business district', 'guzape',
      'katampe extension', 'aso drive', 'diplomatic zone', 'kings court', 'ministers hill',
      'wuse2', 'banana island abuja',
    ],
  },
  {
    fee: 5000,
    areas: [
      'wuse', 'garki', 'jabi', 'utako', 'gudu', 'durumi', 'lugbe', 'apo', 'gwarinpa',
      'life camp', 'kado', 'dawaki', 'lokogoma', 'jahi', 'idu', 'galadimawa',
      'dakibiyu', 'gosa', 'katampe', 'mabushi', 'games village', 'wuye', 'kubwa',
      'dutse', 'byazhin', 'gwarimpa', 'airport road', 'nyanya', 'karu', 'nbgoje',
      'karmo', 'lugbe', 'kabusa',
    ],
  },
  {
    fee: 8000,
    areas: [
      'bwari', 'gwagwalada', 'kuje', 'abaji', 'pyakasa', 'karshi', 'zuba',
      'mpape', 'orozo', 'abucoch',
    ],
  },
]

const LAGOS_ZONES = [
  {
    fee: 4000,
    areas: [
      'victoria island', 'vi', 'ikoyi', 'banana island', 'oniru',
    ],
  },
  {
    fee: 5000,
    areas: [
      'lekki phase 1', 'lekki 1', 'vgc', 'victoria garden city', 'chevron',
      'osapa', 'ikate', 'elegushi', 'idado', 'marwa', 'admiralty',
    ],
  },
  {
    fee: 6000,
    areas: [
      'ajah', 'sangotedo', 'abraham adesanya', 'badore', 'lakowe', 'ogombo',
      'shapati', 'awoyaya', 'abijo', 'ibeju', 'lekki phase 2', 'lekki 2',
      'surulere', 'yaba', 'ikeja', 'maryland', 'gra ikeja', 'opebi', 'oregun',
      'alausa', 'agidingbi', 'allen', 'ogba', 'ojodu', 'aguda', 'lawanson',
    ],
  },
  {
    fee: 7500,
    areas: [
      'magodo', 'ketu', 'ojota', 'mile 12', 'gbagada', 'anthony village', 'anthony',
      'mushin', 'oshodi', 'isolo', 'cele', 'alapere', 'ifako', 'palmgrove',
      'onipanu', 'fadeyi', 'ladipo', 'ilupeju', 'berger', 'ojodu berger', 'idi araba',
    ],
  },
  {
    fee: 10000,
    areas: [
      'ikorodu', 'epe', 'badagry', 'alimosho', 'agege', 'sango', 'dopemu',
      'ipaja', 'meiran', 'abule egba', 'challenge', 'egbeda', 'shasha',
      'ikotun', 'igando', 'akowonjo',
    ],
  },
]

const CITY_FALLBACK_FEE = {
  Abuja: 5000,
  Lagos: 6500,
}

function normalizeArea(area) {
  return String(area || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function matchesZone(inputArea, zoneArea) {
  if (inputArea === zoneArea) return true
  if (inputArea.length < 4 || zoneArea.length < 4) return false
  return inputArea.includes(zoneArea) || zoneArea.includes(inputArea)
}

export function lookupDeliveryFee(city, area) {
  const normalCity = String(city || '').trim()
  const normalArea = normalizeArea(area)

  const zones = normalCity === 'Lagos' ? LAGOS_ZONES
    : normalCity === 'Abuja' ? ABUJA_ZONES
    : null

  if (!zones) return { fee: null, exact: false }

  for (const zone of zones) {
    for (const zoneArea of zone.areas) {
      if (matchesZone(normalArea, zoneArea)) {
        return { fee: zone.fee, exact: true }
      }
    }
  }

  const fallback = CITY_FALLBACK_FEE[normalCity]
  return { fee: fallback ?? null, exact: false }
}
