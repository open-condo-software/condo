const { getLogger } = require('@open-condo/keystone/logging')

const { AddressIdentityConflict } = require('@address-service/domains/common/utils/services/search/searchServiceUtils')
const { DadataSuggestionProvider } = require('@address-service/domains/common/utils/services/suggest/providers/DadataSuggestionProvider')

const { formatDadataHouse, getSavedHouse, matchesAddressParts, normalizeHouse, parseAddressParts } = require('./addressParts')
const { BulkNormalizeTimeout, limitConcurrency, memoizeAsync, providerResult } = require('./bulkNormalizeAsync')
const {
    admitsCandidate, makeDadataCandidate, makePullentiCandidates, makeSavedCandidate, selectCandidate,
} = require('./bulkNormalizeCandidates')
const { readItem, resolveUnit, toGuid } = require('./bulkNormalizeInput')
const { getSourceKey } = require('./bulkNormalizeStore')
const { PullentiJsonProvider } = require('./PullentiJsonProvider')

const logger = getLogger('bulkNormalize')
const ERROR_MESSAGES = {
    INVALID_INPUT: 'Invalid address or address metadata',
    ADDRESS_NOT_FOUND: 'No house candidate was resolved',
    AMBIGUOUS_ADDRESS: 'Multiple house or address records match',
    PROVIDER_UNAVAILABLE: 'An address provider required for resolution was unavailable',
    PERSISTENCE_FAILED: 'Unable to access the stored address',
}

function failure (code, stage, warnings = []) {
    return { result: null, warnings, error: { code, stage, message: ERROR_MESSAGES[code] } }
}

function getOrganizationCity (info) {
    const data = info?.data?.address?.data
    return data?.settlement_with_type || data?.city_with_type || data?.settlement || data?.city || null
}

class BulkAddressNormalizer {
    constructor ({ req, store, helpers, signal, deadline, limits }) {
        this.store = store
        this.helpers = helpers
        this.signal = signal
        const call = async (execute) => {
            signal.throwIfAborted()
            const remaining = deadline - Date.now()
            if (remaining <= 0) throw new BulkNormalizeTimeout()
            return await execute({ abortRequestTimeout: Math.min(limits.providerTimeout, remaining) })
        }

        const pullentiQueue = limitConcurrency(limits.pullenti, signal)
        const fiasQueue = limitConcurrency(limits.fias, signal)
        const dadataQueue = limitConcurrency(limits.dadata, signal)
        this.resolveQueue = limitConcurrency(limits.resolve, signal)
        this.persistQueue = limitConcurrency(limits.persist, signal)
        const pullenti = new PullentiJsonProvider({
            call,
            getObjectParams: memoizeAsync(id => fiasQueue(() => pullenti.getGuids(id))),
        })
        let dadata
        const getDadata = () => {
            dadata ||= new DadataSuggestionProvider({ req })
            return dadata
        }

        this.organization = helpers.tin
            ? dadataQueue(() => providerResult('DaData organization', () => call(options => getDadata().getOrganization(helpers.tin, options))))
                .then(result => result.value)
            : Promise.resolve(null)
        this.parsePullenti = memoizeAsync(query => providerResult('Pullenti', () => pullentiQueue(() => pullenti.parse(query))))
        this.findPullentiGuid = memoizeAsync(guid => providerResult('Pullenti', () => fiasQueue(() => pullenti.findByGuid(guid))))
        this.findStoredGuid = memoizeAsync(guid => store.findByGuid(guid))
        this.findStoredSource = memoizeAsync(source => store.findBySource(source))
        this.queryDadata = memoizeAsync(
            ({ query, count, byId }) => providerResult('DaData', async () => {
                const organizationInfo = byId ? null : await this.organization
                return await dadataQueue(() => call(async (requestOptions) => {
                    const provider = getDadata()
                    const raw = await provider.getAddressSuggestions({ query, count, organizationInfo, byId, requestOptions })
                    return provider.normalize(raw).map((normalized, index) => ({
                        candidate: makeDadataCandidate(normalized, raw[index]),
                        data: raw[index]?.data,
                    }))
                }))
            }),
            ({ query, count, byId }) => JSON.stringify([byId, count, normalizeHouse(query)])
        )
        this.checkFias = memoizeAsync(guid => this.resolveFias(guid))
    }

    async resolveFias (guid) {
        const [pullenti, saved] = await Promise.all([this.findPullentiGuid(guid), this.findStoredGuid(guid)])
        const dadata = !saved.length || !pullenti.value?.confirmedHouse
            ? await this.queryDadata({ query: guid, byId: true })
            : { value: [], failed: false }
        const dadataHouse = dadata.value?.find(({ candidate }) => candidate?.guid === guid)?.candidate
        const dadataUnit = dadata.value?.find(({ candidate, data }) => candidate?.guid !== guid && (
            toGuid(data?.flat_fias_id) === guid || toGuid(data?.room_fias_id) === guid ||
                (String(data?.fias_level) === '9' && toGuid(data?.fias_id) === guid)
        ))
        const dadataOther = dadata.value?.some(({ data }) => toGuid(data?.fias_id) === guid &&
            ['0', '1', '3', '4', '5', '6', '7', '65'].includes(String(data.fias_level)))
        const saysInvalid = Boolean(dadataUnit || dadataOther || pullenti.value?.invalid)
        const saysValid = Boolean(dadataHouse || pullenti.value?.confirmedHouse)
        const invalid = saysInvalid && !saysValid
        const confirmed = saysValid && !saysInvalid
        const candidates = invalid ? [] : saved.map(address => makeSavedCandidate(address, guid, 'heuristic')).filter(Boolean)

        if (dadataHouse && !invalid) candidates.push(dadataHouse)

        // A room's parent is a candidate in its own right. The original UUID
        // still needs replacing and the parent must pass text admission.
        let parentGuid = invalid ? dadataUnit?.candidate?.guid : null
        if (invalid && dadataUnit?.candidate) candidates.push(dadataUnit.candidate)
        const parentPath = invalid && pullenti.value?.unit?.path
        if (!parentGuid && typeof parentPath === 'string') {
            const parent = await this.parsePullenti(parentPath)
            if (parent.value?.guids.length === 1) {
                parentGuid = parent.value.guids[0]
                candidates.push(...makePullentiCandidates(parent.value).map(candidate => ({
                    ...candidate, signal: null, text: false,
                })))
            }
        }

        return {
            invalid: Boolean(invalid),
            confirmed,
            candidates,
            parentGuid,
            dadataFailed: dadata.failed,
            pullentiFailed: pullenti.failed,
        }
    }

    async getPullenti (item) {
        if (!item.rawAddress) return { value: null, failed: false }
        const first = await this.parsePullenti(item.rawAddress)
        const city = getOrganizationCity(await this.organization)
        const localitySupplied = item.parts.places.some(part => part.type === 'locality')
        if (!city || !first.value || first.value.hasLocality || localitySupplied) return first

        const next = await this.parsePullenti(`${city}, ${item.rawAddress}`)
        if (next.value?.guids.length === 1 && next.value.coef > first.value.coef) {
            return { ...next, organizationCity: city }
        }
        return { ...first, failed: next.failed }
    }

    async readSearch (house, item) {
        const address = await this.findStoredSource(getSourceKey(house, this.helpers))
        const saved = address && makeSavedCandidate(address)
        if (admitsCandidate(item, saved)) return { cached: { ...saved, text: true }, suggestions: [], failed: false }
        const first = await this.queryDadata({ query: house, count: 1 })
        return {
            house,
            suggestions: (first.value || []).map(({ candidate }) => candidate).filter(Boolean),
            failed: first.failed,
        }
    }

    async resolveText (item, parsed, fias) {
        const pullenti = makePullentiCandidates(parsed.value).filter(candidate => admitsCandidate(item, candidate))
        const queries = new Map()
        if (item.naive?.address) queries.set(normalizeHouse(item.naive.address), item.naive.address)
        if (parsed.value?.house) {
            const parts = parseAddressParts(parsed.value.house)
            // A standardized spelling with the same address parts needs one external search.
            if (matchesAddressParts(item.parts, parts) && !matchesAddressParts(parts, item.parts)) {
                queries.set(normalizeHouse(parsed.value.house), parsed.value.house)
            }
        }
        const initial = await Promise.all(Array.from(queries.values(), house => this.readSearch(house, item)))
        const textGuids = new Set(pullenti.map(candidate => candidate.guid))
        if (fias?.confirmed) textGuids.add(item.guid)

        let failed = false
        const searches = await Promise.all(initial.map(async (search) => {
            if (search.cached) return [search.cached]
            failed ||= search.failed
            const [first] = search.suggestions
            const unqualified = !item.parts.places.some(part => part.type === 'locality' || part.type === 'territory') && !item.parts.names.length
            const conflicting = first && Array.from(textGuids).some(guid => guid !== first.guid)
            if (!search.failed && (!admitsCandidate(item, first) || unqualified || conflicting)) {
                const retry = await this.queryDadata({ query: search.house, count: 5 })
                failed ||= retry.failed
                if (retry.value) search.suggestions.push(...retry.value.map(({ candidate }) => candidate).filter(Boolean))
            }
            return search.suggestions.map(candidate => ({ ...candidate, signal: 'dadata', text: true }))
        }))
        return { candidates: [...searches.flat(), ...pullenti], failed }
    }

    async resolveItem (input, metadata) {
        const item = readItem(input, metadata)
        if (!item) return { response: failure('INVALID_INPUT', 'validate') }
        const warnings = []
        if (item.hasInvalidGuid) warnings.push('BAD_FIAS')

        const [parsed, fias, organization] = await Promise.all([
            this.getPullenti(item),
            item.guid ? this.checkFias(item.guid) : null,
            this.organization,
        ])
        const text = item.rawAddress ? await this.resolveText(item, parsed, fias) : { candidates: [], failed: false }

        if (fias?.invalid) warnings.push('BAD_FIAS')

        const textCandidates = text.candidates.filter(candidate => admitsCandidate(item, candidate))
        const textGuids = new Set(textCandidates.map(candidate => candidate.guid).filter(Boolean))
        if (fias?.confirmed && textGuids.size && !textGuids.has(item.guid)) warnings.push('CONFLICTING_ADDRESS_AND_FIAS')

        const candidates = [...textCandidates, ...(fias?.candidates || []).filter(candidate => admitsCandidate(item, candidate))]
        const eligibleGuids = Array.from(new Set(candidates.map(candidate => candidate.guid).filter(Boolean)))
        const shouldResolveParent = fias?.parentGuid && eligibleGuids.includes(fias.parentGuid)
        let dadataFailed = Boolean(fias?.dadataFailed || text.failed)

        const byGuid = await Promise.all(eligibleGuids.map(async (guid) => {
            const saved = await this.findStoredGuid(guid)
            const results = saved.map(address => makeSavedCandidate(address, guid, 'heuristic')).filter(candidate => admitsCandidate(item, candidate))

            if (!saved.length && !candidates.some(candidate => candidate.guid === guid && candidate.dadata) &&
                (textGuids.has(guid) || (shouldResolveParent && guid === fias.parentGuid))) {
                const lookup = await this.queryDadata({ query: guid, byId: true })
                dadataFailed ||= lookup.failed
                const matching = lookup.value?.find(({ candidate }) => candidate?.guid === guid)?.candidate
                if (admitsCandidate(item, matching)) results.push(matching)
            }
            return results
        }))
        candidates.push(...byGuid.flat())

        if (fias?.confirmed && eligibleGuids.includes(item.guid)) {
            const confirmed = candidates.find(candidate => candidate.guid === item.guid)
            candidates.push({ ...confirmed, signal: 'fias' })
        }

        const organizationCity = getOrganizationCity(organization)
        const organizationParts = organizationCity ? parseAddressParts(organizationCity) : null
        const { winner, ambiguous } = selectCandidate(candidates, organizationParts)
        if (ambiguous) return { response: failure('AMBIGUOUS_ADDRESS', 'resolve-house', warnings) }
        const pullentiFailed = Boolean(fias?.pullentiFailed || parsed.failed)
        if (!winner) {
            const code = dadataFailed || pullentiFailed ? 'PROVIDER_UNAVAILABLE' : 'ADDRESS_NOT_FOUND'
            return { response: failure(code, 'resolve-house', warnings) }
        }

        if (dadataFailed) warnings.push('DADATA_UNAVAILABLE')
        if (pullentiFailed) warnings.push('PULLENTI_UNAVAILABLE')
        if (winner.signals.has('source') && winner.guid && Array.from(textGuids).some(guid => guid !== winner.guid)) {
            logger.info({ msg: 'Bulk normalize found a conflicting house for an address alias', entity: 'Address', entityId: winner.addresses.keys().next().value })
        }

        const pullentiUnit = parsed.value?.house && parsed.value.guids.includes(winner.guid) ? parsed.value.unit : null
        const inputHouse = fias?.confirmed ? item.guid : fias?.parentGuid
        const useTail = !inputHouse || winner.guid === inputHouse || item.tail?.unitName === pullentiUnit?.unitName || item.tail?.unitName === item.naive?.unitName
        const unit = resolveUnit(item, pullentiUnit, useTail)
        if (unit.unitMissing) warnings.push('UNIT_NOT_FOUND')

        const sources = new Set()
        if (winner.dadata) {
            const canonical = formatDadataHouse(winner.dadata.data)
            if (canonical) sources.add(getSourceKey(canonical, this.helpers))
            const hasLocality = item.parts?.places.some(part => part.type === 'locality')
            const hasRegion = item.parts?.places.some(part => part.type === 'region')
            const independentlyMatched = winner.textMatchedByDadata && winner.textMatchedByPullenti && !parsed.organizationCity
            const textWithOrganization = !item.guid && this.helpers.tin && winner.textMatchedByDadata
            if ((textWithOrganization || (hasLocality && (hasRegion || independentlyMatched))) && onlyMatchesWinner(textGuids, winner)) {
                sources.add(getSourceKey(item.naive.address, this.helpers))
            }
        }
        return { winner, sources, unit, warnings }
    }

    async normalize (items) {
        const resolved = await Promise.all(items.map(([key, metadata]) => this.resolveQueue(async () => {
            try {
                return await this.resolveItem(key, metadata)
            } catch (err) {
                if (err instanceof BulkNormalizeTimeout) throw err
                logger.error({ msg: 'Bulk normalize failed to read an address', err })
                return { response: failure('PERSISTENCE_FAILED', 'resolve-house') }
            }
        })))

        this.signal.throwIfAborted()
        const winners = new Map()
        const sourceOwners = new Map()
        for (const { winner, sources } of resolved) {
            if (!winner) continue
            const key = winner.guid || winner.addresses.keys().next().value
            if (!winners.has(key)) winners.set(key, { winner, addresses: new Map(), sources: new Set() })
            const group = winners.get(key)
            if (!group.winner.dadata && winner.dadata) group.winner = winner
            for (const [id, address] of winner.addresses) group.addresses.set(id, address)
            for (const source of sources) {
                group.sources.add(source)
                if (!sourceOwners.has(source)) sourceOwners.set(source, new Set())
                sourceOwners.get(source).add(key)
            }
        }

        const persisted = new Map(await Promise.all(Array.from(winners, ([key, group]) => this.persistQueue(async () => {
            const { winner, addresses, sources } = group
            if (addresses.size > 1) return [key, { code: 'AMBIGUOUS_ADDRESS' }]
            const existingAddress = addresses.values().next().value

            try {
                const address = winner.dadata
                    ? await this.store.persist({
                        guid: winner.guid,
                        dadata: winner.dadata,
                        sources: Array.from(sources).filter(source => sourceOwners.get(source).size === 1),
                        helpers: this.helpers,
                        existingAddress,
                    })
                    : existingAddress
                return [key, { address }]
            } catch (err) {
                if (err instanceof AddressIdentityConflict) return [key, { code: 'AMBIGUOUS_ADDRESS' }]
                logger.error({ msg: 'Bulk normalize failed to persist an address', err })
                return [key, { code: 'PERSISTENCE_FAILED' }]
            }
        }))))

        return { items: Object.fromEntries(items.map(([key], index) => {
            const { response, winner, unit, warnings } = resolved[index]
            if (response) return [key, response]
            const { address, code } = persisted.get(winner.guid || winner.addresses.keys().next().value)
            if (code) return [key, failure(code, 'persist', warnings)]
            const result = {
                id: address.id,
                house: getSavedHouse(address),
                globalId: winner.guid || null,
                unitName: unit.unitName,
                unitType: unit.unitType,
                confidence: winner.signals.has('source') ? 100 : Math.min(winner.score, 100),
            }
            return [key, { result, warnings, error: null }]
        })) }
    }
}

function onlyMatchesWinner (textGuids, winner) {
    return textGuids.size === 1 && textGuids.has(winner.guid)
}

module.exports = { BulkAddressNormalizer }
