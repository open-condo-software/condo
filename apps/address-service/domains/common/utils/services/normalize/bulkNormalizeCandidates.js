const { getSavedHouse, formatDadataHouse, matchesAddressParts, normalizeHouse, parseAddressParts } = require('./addressParts')
const { toGuid } = require('./bulkNormalizeInput')
const { getStoredGuid } = require('./bulkNormalizeStore')

const SIGNALS = {
    source: 100,
    heuristic: 90,
    dadata: 40,
    pullenti: 40,
    fias: 20,
    organization: 10,
}

function makeDadataCandidate (result, raw) {
    const { data } = result
    const country = data.country_iso_code
    const guid = toGuid(data.house_fias_id) || toGuid(data.stead_fias_id)
    if (!guid || (country && country !== 'RU')) return null
    if (data.fias_actuality_state != null && String(data.fias_actuality_state) !== '0') return null

    const house = formatDadataHouse(data, { short: true })
    if (!house) return null

    return {
        guid,
        house,
        parts: parseAddressParts(formatDadataHouse(data)),
        dadata: { ...result, rawHouseGuid: toGuid(raw.data.house_fias_id) },
    }
}

function makeSavedCandidate (address, guid = getStoredGuid(address), signal = 'source') {
    if (!toGuid(address?.id) || !address.address) return null
    if (address.meta?.data?.country_iso_code && address.meta.data.country_iso_code !== 'RU') return null

    const storedGuid = getStoredGuid(address)
    if (storedGuid && guid && storedGuid !== guid) return null

    const house = getSavedHouse(address)
    const parts = parseAddressParts(house)
    if (!parts.building.house && !parts.building.stead) return null
    return { guid, house, parts, address, signal }
}

function admitsCandidate (item, candidate) {
    if (!candidate?.house || !(candidate.parts.building.house || candidate.parts.building.stead)) return false
    if (!item.parts) return true
    if (!item.parts.building.house && !item.parts.building.stead && candidate.guid !== item.guid) return false
    return matchesAddressParts(item.parts, candidate.parts)
}

function makePullentiCandidates (result) {
    if (!result?.house) return []
    const parts = parseAddressParts(result.house)
    return result.guids.map(guid => ({
        guid,
        house: result.house,
        parts,
        signal: result.coef === 100 ? 'pullenti' : null,
        text: true,
    }))
}

function getCandidateKey (candidate) {
    return candidate.guid || candidate.address?.id || normalizeHouse(candidate.house)
}

function selectCandidate (candidates, organizationParts) {
    const groups = new Map()
    for (const candidate of candidates) {
        const key = getCandidateKey(candidate)
        const group = groups.get(key) || {
            guid: candidate.guid,
            house: candidate.house,
            addresses: new Map(),
            signals: new Set(),
        }
        if (candidate.address) group.addresses.set(candidate.address.id, candidate.address)
        if (candidate.signal) group.signals.add(candidate.signal)
        if (candidate.dadata) group.dadata = candidate.dadata
        if (candidate.signal === 'dadata') group.textMatchedByDadata = true
        if (candidate.signal === 'pullenti') group.textMatchedByPullenti = true
        if (organizationParts && matchesAddressParts(organizationParts, candidate.parts)) group.signals.add('organization')
        groups.set(key, group)
    }

    const ranked = Array.from(groups.values())
        .filter(candidate => candidate.addresses.size || candidate.dadata)
        .map(candidate => ({
            ...candidate,
            score: Array.from(candidate.signals).reduce((score, signal) => score + SIGNALS[signal], 0),
        }))
    const rank = (a, b) => Number(b.signals.has('source')) - Number(a.signals.has('source'))
        || b.score - a.score || Number(b.signals.has('dadata')) - Number(a.signals.has('dadata'))

    ranked.sort(rank)
    const [winner, second] = ranked
    if (!winner) return { winner: null, ambiguous: false }
    if (winner.addresses.size > 1 || (second && rank(winner, second) === 0)) return { winner: null, ambiguous: true }
    return { winner, ambiguous: false }
}

module.exports = { admitsCandidate, makeDadataCandidate, makePullentiCandidates, makeSavedCandidate, selectCandidate }
