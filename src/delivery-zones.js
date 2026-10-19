const ABUJA_ZONES = [
  {
    fee: 3500,
    areas: [
      'diplomatic zone', 'kings court', 'ministers hill', 'banana island abuja',
    ],
  },
  {
    fee: 5000,
    areas: [
      'wuse', 'wuse 2', 'wuse ii', 'wuse2', 'central business district', 'utako',
      'gudu', 'kado', 'dawaki', 'jahi', 'dakibiyu', 'gosa', 'games village',
      'wuye', 'dutse', 'byazhin', 'airport road', 'nbgoje', 'karmo',
    ],
  },
  {
    fee: 6000,
    areas: [
      'garki', 'jabi', 'durumi', 'katampe', 'mabushi',
      'aso drive', 'lokogoma', 'galadimawa', 'karu', 'nyanya',
      'aya', 'a y a', 'a.y.a', 'naf valley',
    ],
  },
  {
    fee: 6500,
    areas: [
      'kabusa', 'katampe extension',
    ],
  },
  {
    fee: 7000,
    areas: [
      'maitama', 'guzape', 'gwarinpa', 'gwarimpa', 'asokoro', 'lugbe', 'idu', 'idu industrial',
    ],
  },
  {
    fee: 7500,
    areas: [
      'life camp',
    ],
  },
  {
    fee: 8000,
    areas: [
      'apo', 'apo resettlement', 'apo mechanic village', 'apo mechanical village', 'apo primary school',
      'bwari', 'gwagwalada', 'kuje', 'abaji', 'pyakasa', 'karshi', 'zuba',
      'mpape', 'orozo', 'abucoch',
    ],
  },
  {
    fee: 9000,
    areas: [
      'kubwa',
    ],
  },
  {
    fee: 10000,
    areas: [
      'mararaba', 'maraba', 'masaka',
    ],
  },
]

const LAGOS_ZONES = [
  {
    fee: 4000,
    areas: [
      'victoria island', 'vi', 'banana island', 'oniru',
    ],
  },
  {
    fee: 5000,
    areas: [
      'lekki phase 1', 'lekki 1', 'vgc', 'victoria garden city',
      'elegushi', 'idado', 'marwa', 'admiralty', 'ikoyi',
    ],
  },
  {
    fee: 5500,
    areas: [
      'chevron',
    ],
  },
  {
    fee: 6000,
    areas: [
      'lekki phase 2', 'lekki 2',
      'surulere', 'yaba', 'ikeja', 'maryland', 'gra ikeja', 'opebi', 'oregun',
      'agidingbi', 'allen', 'ogba', 'ojodu', 'aguda', 'lawanson',
    ],
  },
  {
    fee: 6500,
    areas: [
      'ikate',
    ],
  },
  {
    fee: 7000,
    areas: [
      'osapa',
    ],
  },
  {
    fee: 8000,
    areas: [
      'ajah', 'sangotedo', 'abraham adesanya', 'badore', 'lakowe', 'ogombo',
      'shapati', 'awoyaya', 'abijo', 'ibeju',
      'magodo', 'ketu', 'ojota', 'mile 12', 'gbagada', 'anthony village', 'anthony',
      'mushin', 'oshodi', 'isolo', 'cele', 'alapere', 'ifako', 'palmgrove',
      'onipanu', 'fadeyi', 'ladipo', 'ilupeju', 'berger', 'ojodu berger', 'idi araba',
      'alausa',
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

const PORT_HARCOURT_ZONES = [
  {
    fee: 5000,
    areas: [
      'port harcourt', 'ph', 'ph town', 'town', 'port harcourt town',
      'old gra', 'old g.r.a', 'new gra', 'new g.r.a', 'gra',
      'eastern bypass', 'd-line', 'd line', 'trans amadi',
      'peter odili road', 'peter odili', 'stadium road', 'woji',
      'rumuola', 'rumuomasi', 'aba road',
    ],
  },
  {
    fee: 6000,
    areas: [
      'eliozu', 'rumuokoro', 'ada george', 'rumuigbo', 'mgbuoba',
      'elelenwo', 'choba', 'aluu', 'uniport', 'airport road',
      'omagwa', 'eleme', 'igwuruta', 'oyigbo',
    ],
  },
]

// Spelling variants kept for matching what customers type; hidden from the suggestion list.
const SUGGESTION_ALIASES = new Set([
  'vi', 'lekki 1', 'lekki 2', 'victoria garden city', 'anthony', 'ojodu berger', 'gra ikeja',
  'wuse ii', 'wuse2', 'gwarimpa', 'banana island abuja', 'a y a', 'a.y.a', 'maraba',
  'apo mechanical village', 'apo primary school', 'idu industrial',
  'port harcourt', 'ph', 'town', 'ph town', 'old g.r.a', 'new g.r.a', 'gra', 'd line', 'peter odili',
])
const SUGGESTION_LABELS = {
  vgc: 'VGC', 'old gra': 'Old GRA', 'new gra': 'New GRA', 'd-line': 'D-Line', aya: 'AYA',
  'naf valley': 'NAF Valley', 'kings court': "King's Court", 'port harcourt town': 'Port Harcourt Town',
}

function titleCase(area) {
  return SUGGESTION_LABELS[area] || area.replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

function normalizeArea(area) {
  return String(area || '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function normalizeCity(city) {
  const value = String(city || '').toLowerCase().trim().replace(/\s+/g, ' ')
  if (value === 'lagos') return 'Lagos'
  if (value === 'abuja') return 'Abuja'
  if (value === 'ph' || value === 'port harcourt' || value === 'port-harcourt') return 'Port Harcourt'
  return String(city || '').trim()
}

export function lookupDeliveryFee(city, area) {
  const normalCity = normalizeCity(city)
  const normalArea = normalizeArea(area)

  const zones = normalCity === 'Lagos' ? LAGOS_ZONES
    : normalCity === 'Abuja' ? ABUJA_ZONES
    : normalCity === 'Port Harcourt' ? PORT_HARCOURT_ZONES
    : null

  if (!zones) return { fee: null, exact: false }

  // 1. Exact match against a known area name
  for (const zone of zones) {
    for (const zoneArea of zone.areas) {
      if (normalArea === zoneArea) return { fee: zone.fee, exact: true }
    }
  }

  if (normalArea.length >= 4) {
    // 2. The typed area contains a known zone name (e.g. "Off X Road, Wuse 2")
    //    — prefer the longest/most specific zone name found.
    let best = null
    for (const zone of zones) {
      for (const zoneArea of zone.areas) {
        if (zoneArea.length >= 4 && normalArea.includes(zoneArea)) {
          if (!best || zoneArea.length > best.zoneArea.length) best = { fee: zone.fee, zoneArea }
        }
      }
    }
    if (best) return { fee: best.fee, exact: true }

    // 3. A known zone name contains the typed area (e.g. "Katampe" within "Katampe Extension")
    //    — prefer the closest/shortest zone name match.
    for (const zone of zones) {
      for (const zoneArea of zone.areas) {
        if (zoneArea.length >= 4 && zoneArea.includes(normalArea)) {
          if (!best || zoneArea.length < best.zoneArea.length) best = { fee: zone.fee, zoneArea }
        }
      }
    }
    if (best) return { fee: best.fee, exact: true }
  }

  // Unknown area: no fee. Checkout takes payment for the bouquet only and we confirm delivery after.
  return { fee: null, exact: false }
}

// Area names to suggest in the checkout "Area / district" field for a city.
export function deliveryAreaSuggestions(city) {
  const normalCity = normalizeCity(city)
  const zones = normalCity === 'Lagos' ? LAGOS_ZONES
    : normalCity === 'Abuja' ? ABUJA_ZONES
    : normalCity === 'Port Harcourt' ? PORT_HARCOURT_ZONES
    : []
  const names = zones.flatMap((zone) => zone.areas).filter((area) => !SUGGESTION_ALIASES.has(area))
  return [...new Set(names.map(titleCase))].sort((a, b) => a.localeCompare(b))
}
