const isPlainObject = require('lodash/isPlainObject')
const { validate: isUUID } = require('uuid')

const { parser, parseAddressParts } = require('./addressParts')

const UNIT_TYPES = new Set(['flat', 'parking', 'apartment', 'commercial', 'warehouse'])

function toGuid (value) {
    return isUUID(value) ? value.toLowerCase() : null
}

function hasUnknownFields (value, allowed) {
    return Object.keys(value).some(key => !allowed.includes(key))
}

function readBulkNormalizeRequest (body, maxItems) {
    if (!isPlainObject(body) || hasUnknownFields(body, ['items', 'helpers']) || !isPlainObject(body.items)) return null

    const items = Object.entries(body.items)
    if (!items.length || items.length > maxItems) return null

    const { helpers = {} } = body
    if (!isPlainObject(helpers) || hasUnknownFields(helpers, ['tin'])) return null

    for (const [, item] of items) {
        if (isPlainObject(item) && hasUnknownFields(item, ['addressMeta'])) return null
        if (isPlainObject(item?.addressMeta) && hasUnknownFields(item.addressMeta, ['globalId', 'unitName', 'unitType'])) return null
    }

    const tin = typeof helpers.tin === 'string' && /^(?:\d{10}|\d{12})$/.test(helpers.tin.trim()) ? helpers.tin.trim() : null
    return { items, helpers: tin ? { tin } : {} }
}

function readItem (input, item) {
    if (!input.trim() || !isPlainObject(item)) return null
    const { addressMeta = {} } = item
    if (!isPlainObject(addressMeta) || Object.values(addressMeta).some(value => value != null && typeof value !== 'string')) return null

    const [guidPart, ...tailParts] = (addressMeta.globalId || '').split(',')
    const guid = toGuid(guidPart.trim())
    const keyGuid = toGuid(input.trim())
    if (keyGuid && addressMeta.globalId?.trim() && guid !== keyGuid) return null

    const rawAddress = keyGuid ? null : input.trim()
    const naive = rawAddress ? parser.parseExplicit(rawAddress) : null
    const tail = tailParts.join(',').trim()
    return {
        rawAddress,
        naive,
        parts: naive ? parseAddressParts(naive.address) : null,
        guid: keyGuid || guid,
        hasInvalidGuid: Boolean(addressMeta.globalId?.trim() && !guid),
        unitExpected: Boolean(naive?.hasUnit || tail || addressMeta.unitName != null),
        tail: tail ? parser.parseUnitDescription(tail) : null,
        explicit: {
            unitName: addressMeta.unitName?.trim() || null,
            unitType: UNIT_TYPES.has(addressMeta.unitType) ? addressMeta.unitType : null,
        },
    }
}

function preserveExplicitUnitDescription (pullenti, naive) {
    if (!pullenti?.unitName || !naive?.hasUnit || !naive.unitName) return pullenti

    // A parenthesized apartment reference belongs to the explicitly named unit.
    // Pullenti can invert that hierarchy, e.g. "кл.1 (кв.25)" into "кв.25, помещ.1".
    if (naive.unitType && naive.unitName.includes('(')) {
        return { unitName: naive.unitName, unitType: naive.unitType }
    }

    const sourceNumber = naive.unitName.match(/\d+/)?.[0]?.replace(/^0+(?=\d)/, '')
    const parsedNumber = pullenti.unitName.match(/\d+/)?.[0]?.replace(/^0+(?=\d)/, '')
    // Pullenti normalizes lists, fractions and room annotations. Keep the
    // explicit source representation when both parsers identify the same unit.
    if (sourceNumber && sourceNumber === parsedNumber) return { ...pullenti, unitName: naive.unitName }
    return pullenti
}

function resolveUnit ({ explicit, tail, naive, unitExpected }, parsedUnit, useTail) {
    const pullenti = preserveExplicitUnitDescription(parsedUnit, naive)
    const tailCandidate = useTail ? tail : null
    const unitName = [explicit, tailCandidate, pullenti, naive].find(unit => unit?.unitName)?.unitName || null
    const unitType = unitName ? explicit.unitType || [pullenti, tailCandidate, naive].find(unit => unit?.unitName === unitName && unit.unitType)?.unitType || null : null

    return {
        unitName,
        unitType,
        unitMissing: !unitName && (unitExpected || Boolean(pullenti)),
    }
}

module.exports = { readBulkNormalizeRequest, readItem, resolveUnit, toGuid }
