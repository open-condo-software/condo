const { createInstance } = require('@open-condo/clients/pullenti-client')
const { PullentiClient } = require('@open-condo/clients/pullenti-client/PullentiClient')
const conf = require('@open-condo/config')

const { parser } = require('./addressParts')
const { toGuid } = require('./bulkNormalizeInput')

const HOUSE_LEVELS = new Set(['building', 'plot'])
const UNIT_LEVELS = new Set(['apartment', 'room', 'carplace'])
const LOCALITY_LEVELS = new Set(['regioncity', 'city', 'locality'])
const HOUSE_PARENT_LEVELS = new Set(['regionarea', 'regioncity', 'district', 'settlement', 'city', 'citydistrict', 'locality', 'territory', 'street'])

function getLevel (item) {
    return typeof item.level === 'string' ? item.level.toLowerCase() : null
}

function isActual (gar) {
    return gar.actual !== false && gar.expired !== true && !gar.actualObjectId &&
        (gar.actual === true || gar.expired === false)
}

function isArchived (gar) {
    return gar.actual === false || gar.expired === true || Boolean(gar.actualObjectId)
}

class PullentiJsonProvider {
    constructor ({ call, getObjectParams }) {
        this.call = call
        this.getObjectParams = getObjectParams
        this.createClient = () => conf.PULLENTI_JSON_URL ? new PullentiClient(conf.PULLENTI_JSON_URL) : createInstance()
    }

    async parse (query) {
        const result = await this.call(requestOptions => this.createClient().processAddressJson(query, {}, requestOptions))
        if (result == null) return null
        if (!Array.isArray(result.items)) throw new Error('Unexpected Pullenti address response')

        const items = result.items.filter(item => item && getLevel(item))
        const leaf = items.find(item => getLevel(item) === 'building') || items.find(item => getLevel(item) === 'plot')
        const units = items.filter(item => UNIT_LEVELS.has(getLevel(item)))
        const unitName = units.map(item => item.normal).filter(Boolean).join(', ')
        const house = items
            .filter(item => item === leaf || HOUSE_PARENT_LEVELS.has(getLevel(item)))
            .map(item => item.normal)
            .filter(Boolean)
            .join(', ')

        let guids = []
        if (leaf) {
            const actualObjects = (leaf.gars || []).filter(gar => gar?.id && isActual(gar) && gar.objectIds?.length !== 0)
            guids = Array.from(new Set((await Promise.all(actualObjects.map(gar => this.getObjectParams(gar.id)))).flat()))
        }

        return {
            house: leaf && house ? house : null,
            guids,
            coef: Number(result.coef),
            hasLocality: items.some(item => LOCALITY_LEVELS.has(getLevel(item))),
            unit: units.length ? parser.parseUnitDescription(unitName) : null,
        }
    }

    async findByGuid (guid) {
        const result = await this.call(requestOptions => this.createClient().searchByGuidJson(guid, requestOptions))
        if (!Array.isArray(result)) throw new Error('Unexpected Pullenti FIAS response')

        const objects = result.filter(Boolean)
        const houses = objects.filter(gar => HOUSE_LEVELS.has(getLevel(gar)) && isActual(gar) && gar.objectIds?.length !== 0)
        const confirmedHouse = houses.length === 1 ? houses[0] : null
        const invalid = objects.length > 0 && objects.every(gar => (
            isArchived(gar) || (getLevel(gar) && !HOUSE_LEVELS.has(getLevel(gar)))
        ))
        const unit = invalid && objects.length === 1 && UNIT_LEVELS.has(getLevel(objects[0])) ? objects[0] : null
        return { confirmedHouse, invalid, unit }
    }

    async getGuids (id) {
        const params = await this.call(requestOptions => this.createClient().getGarObjectParams(id, requestOptions))
        if (!params || typeof params !== 'object' || Array.isArray(params)) throw new Error('Unexpected Pullenti object parameters')
        const { guid, Guid } = params
        const values = guid || Guid || []
        if (!Array.isArray(values)) throw new Error('Unexpected Pullenti GUID parameters')
        return Array.from(new Set(values.map(toGuid).filter(Boolean)))
    }
}

module.exports = { PullentiJsonProvider }
