const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils')

const parser = new AddressFromStringParser()
const NUMBER = String.raw`\d[\dа-яёa-z]*(?:\s*[-/]\s*[\dа-яёa-z]+)*`
const SINGLE_LETTER = String.raw`[а-яёa-z]`
const BUILDING_MARKERS = [
    ['house', 'владение|домовладение|двлд|влд|сооружение|сооруж|соор|здание|зд|дом|д', NUMBER],
    ['stead', 'земельный участок|участок|уч', NUMBER],
    ['block', 'корпус|корп|кор|к', `(?:${NUMBER}|${SINGLE_LETTER})`],
    ['structure', 'строение|стр', `(?:${NUMBER}|${SINGLE_LETTER})`],
    ['letter', 'литера|литер|лит', SINGLE_LETTER],
]
const BUILDING_PATTERNS = BUILDING_MARKERS.map(([part, markers, number]) => [
    part,
    new RegExp(String.raw`(?:^|[\s,])(?:${markers})(?:\.\s*|\s+|(?=\d))(${number})(?=$|[\s,.])`, 'iu'),
])
const STREET_TYPES = [
    ['street', 'улица|ул'],
    ['avenue', 'проспект|пр-кт|пр-т'],
    ['lane', 'переулок|пер'],
    ['embankment', 'набережная|наб'],
    ['square', 'площадь|пл'],
    ['boulevard', 'бульвар|б-р|бул'],
    ['passage', 'проезд|пр-д'],
    ['highway', 'шоссе|ш'],
    ['deadEnd', 'тупик'],
    ['tract', 'тракт'],
    ['alley', 'аллея|ал'],
]
const STREET_MARKERS = STREET_TYPES.map(([, markers]) => markers).join('|')
const INLINE_STREET = new RegExp(String.raw`^(.+?)\s+((?:${STREET_MARKERS})(?:\.\s*|\s+).+)$`, 'iu')
const PLACE_PATTERNS = [
    ...STREET_TYPES.map(([kind, markers]) => ['street', markers, kind]),
    ['territory', 'территория|микрорайон|мкр-н|мкр|тер|квартал|кв-л|снт|днп|тсн'],
    ['locality', 'пос[её]лок городского типа|рабочий пос[её]лок|сельский пос[её]лок|пос[её]лок|деревня|станица|город|село|хутор|аул|рп|пгт|сп|пос|ст-ца|ст|г|с|х|п|д'],
    ['region', 'республика|область|край|автономный округ|аобл|респ|обл|ао'],
    ['district', 'муниципальный район|городской округ|городское поселение|сельское поселение|район|р-н|улус|муниципальный округ|м[.]о'],
].map(([part, markers, kind]) => [
    part,
    kind,
    new RegExp(String.raw`^(?:${markers})(?:\.\s*|\s+)(.+)$`, 'iu'),
    new RegExp(String.raw`^(.+?)\s+(?:${markers})\.?$`, 'iu'),
])

function normalizeHouse (value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ')
}

function normalizeName (value) {
    return value.toLowerCase().replace(/ё/g, 'е').replace(/[.\s]+/g, ' ').trim()
}

function normalizeStreetName (value) {
    // GAR may put the same ordinal before or after the street name.
    const normalized = normalizeName(value).replace(/^(?:им|имени)\s+/, '')
    const ordinal = /(?:^|\s)(\d+)-(?:й|я|е|ая|ый|ое|ий)(?=\s|$)/g
    const numbers = Array.from(normalized.matchAll(ordinal))
    if (numbers.length !== 1) return normalized
    const name = normalized.replace(ordinal, ' ').replace(/\s+/g, ' ').trim()
    return `${name} ${numbers[0][1]}`.trim()
}

function normalizeNumber (value) {
    return value.toLowerCase().replace(/\s/g, '')
}

function parseAddressParts (address) {
    const building = {}
    const places = []
    const names = []

    const segments = address.split(',')
    for (const [index, addressPart] of segments.entries()) {
        let part = addressPart.trim().replace(/^(кв-л)(?=\p{L})/iu, '$1 ')
        if (!part || /^(?:россия|российская федерация|рф|\d{6})$/iu.test(part)) continue

        let numberStart = part.length
        for (const [type, pattern] of BUILDING_PATTERNS) {
            const match = part.match(pattern)
            if (match) {
                building[type] = normalizeNumber(match[1])
                numberStart = Math.min(numberStart, match.index)
            }
        }

        if (index === segments.length - 1 && numberStart === part.length && !building.house && !building.stead) {
            const match = part.match(new RegExp(String.raw`(?:^|\s)(${NUMBER})$`, 'iu'))
            if (match) {
                building.house = normalizeNumber(match[1])
                numberStart = match.index
            }
        }

        part = part.slice(0, numberStart).trim()
        if (!part) continue

        // DaData sometimes encodes a settlement's parent inside its display name.
        const parent = part.match(/^(.*?)\s*\(([^()]+)\)$/u)
        if (parent && getPlace(parent[2])) {
            places.push(getPlace(parent[2]))
            part = parent[1].trim()
        }
        const inline = part.match(INLINE_STREET)
        const split = inline && getPlace(part)?.type !== 'street' ? inline.slice(1) : [part]
        for (const segment of split) {
            const place = getPlace(segment)
            if (place) places.push(place)
            else names.push(normalizeName(segment))
        }
    }

    return { building, places, names }
}

function getPlace (part) {
    for (const [type, kind, prefix, suffix] of PLACE_PATTERNS) {
        const match = part.match(prefix) || part.match(suffix)
        if (match) {
            // Some imports use "ул." in front of a complete street type and name.
            const nested = kind === 'street' && match[0] !== match[1] ? getPlace(match[1]) : null
            if (nested?.type === 'street' && nested.kind !== 'street') return nested
            return { type, kind, name: ['street', 'territory'].includes(type) ? normalizeStreetName(match[1]) : normalizeName(match[1]) }
        }
    }
    return null
}

function matchesAddressParts (expected, candidate) {
    const matchesBuilding = Object.entries(expected.building).every(([type, value]) => candidate.building[type] === value)
    const matchesPlaces = expected.places.every(({ type, kind, name }) => candidate.places.some(place => {
        if (type === 'locality' && place.type === 'territory') {
            const locality = getPlace(place.name)
            if (locality?.type === 'locality' && locality.name === name) return true
        }
        if (kind && kind !== place.kind) return false
        if (place.name === name && (place.type === type || (type === 'region' && place.type === 'locality'))) return true
        return type === 'locality' && place.type === 'locality' && candidate.places.some(street => (
            street.type === 'street' && name === `${place.name} ${street.name}`
        ))
    }))
    const candidateNames = [...candidate.names, ...candidate.places.map(({ name }) => name)]
    // For unlabelled text, also accept locality and street written without a comma.
    const candidatePath = candidateNames.join(' ')
    const matchesNames = expected.names.every(name => candidateNames.includes(name) || ` ${candidatePath} `.includes(` ${name} `))
    return matchesBuilding && matchesPlaces && matchesNames
}

function formatDadataHouse (data, { short = false } = {}) {
    const house = data.house_fias_id && data.house && data.house_type !== 'уч'
        ? [data.house_type || 'д', data.house].join(' ')
        : data.stead ? [data.stead_type || 'уч', data.stead].join(' ')
            : data.house && [data.house_type || 'д', data.house].join(' ')
    const block = data.block && [data.block_type || 'к', data.block].join(' ')
    const city = data.city_with_type || (data.city && [data.city_type || 'г', data.city].join(' '))
    const parts = [
        !short && data.country,
        data.region_with_type || data.region,
        (!short || !city) && (data.area_with_type || data.area),
        city,
        (!short || !city) && (data.city_district_with_type || data.city_district),
        data.settlement_with_type || (data.settlement && [data.settlement_type || 'п', data.settlement].join(' ')),
        data.territory_with_type || data.territory,
        data.street_with_type || (data.street && [data.street_type || 'ул', data.street].join(' ')),
        house,
        block,
    ]
    return Array.from(new Set(parts.filter(Boolean))).join(', ')
}

function getSavedHouse (address) {
    const data = address.meta?.data || {}
    const canonical = parser.parseExplicit(address.address).address
    const formatted = formatDadataHouse(data, { short: true })
    return formatted && (data.house || data.stead) ? formatted : canonical.replace(/^(?:россия|российская федерация|рф)\s*,\s*/iu, '')
}

module.exports = {
    parser,
    formatDadataHouse,
    getSavedHouse,
    matchesAddressParts,
    normalizeHouse,
    parseAddressParts,
}
