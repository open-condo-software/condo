require('@condo/domains/common/utils/testSchema/env').mockEnv({
    VOIP_CALL_STATUS_JWT_SECRET: 'voip-test-secret',
})
jest.mock('@open-condo/keystone/kv', () => ({
    getKVClient: jest.fn().mockReturnValue({ get: jest.fn(), set: jest.fn() }),
}))
jest.mock('@open-condo/miniapp-utils/helpers/uuid', () => ({ generateUUIDv4: jest.fn() }))

const { createHmac, randomUUID } = require('crypto')

const conf = require('@open-condo/config')
const { getKVClient } = require('@open-condo/keystone/kv')

const { CALL_STATUS_STARTED, CALL_STATUS_ENDED, CALL_STATUS_TTL_IN_SECONDS } = require('@condo/domains/miniapp/constants')

const { generateCallStatusId, buildCallStatusToken, parseCallStatusToken, setCallStatus, getCallStatus, getCallStatusById } = require('./voip')

const kv = getKVClient()

describe('VoIP call tokens and state', () => {
    let records
    let state

    beforeEach(() => {
        jest.clearAllMocks()
        records = new Map()
        kv.get.mockImplementation(async key => records.get(key) ?? null)
        kv.set.mockImplementation(async (key, value) => {
            records.set(key, value)
            return 'OK'
        })
        state = {
            id: generateCallStatusId(),
            b2cAppId: randomUUID(),
            organizationId: randomUUID(),
            addressKey: randomUUID(),
            callId: 'external-call/+?id',
            status: CALL_STATUS_STARTED,
            startingMessagesIdsByUserIds: { user: 'message' },
            callMeta: null,
        }
    })

    test('signs a random 128-bit ID with a truncated 128-bit HMAC', () => {
        const token = buildCallStatusToken(state.id)
        const expectedSignature = createHmac('sha256', conf.VOIP_CALL_STATUS_JWT_SECRET)
            .update(`voip-call:v1:${state.id}`).digest().subarray(0, 16).toString('base64url')

        expect(token).toBe(`${state.id}.${expectedSignature}`)
        expect(token).toHaveLength(45)
        expect(token).toMatch(/^[\w-]{22}\.[\w-]{22}$/)
        expect(parseCallStatusToken(token)).toBe(state.id)
        expect(generateCallStatusId()).not.toBe(state.id)
        expect(kv.get).not.toHaveBeenCalled()
    })

    describe('rejects malformed tokens', () => {
        test.each([
            null, undefined, '', 'bad-token', 'a'.repeat(1000),
            `${'A'.repeat(22)}.${'A'.repeat(21)}`,
            `${'A'.repeat(21)}B.${'A'.repeat(22)}`,
            `${'A'.repeat(22)}.${'A'.repeat(21)}B`,
            `${'A'.repeat(22)}.${'A'.repeat(21)}=`,
        ])('rejects malformed tokens without reading Redis: %p', token => {
            expect(parseCallStatusToken(token)).toBeNull()
            expect(kv.get).not.toHaveBeenCalled()
        })
    })

    test('rejects unsigned IDs, tampering, and signatures made with another secret', () => {
        const token = buildCallStatusToken(state.id)
        const [id, signature] = token.split('.')
        const changedId = `${id[0] === 'A' ? 'B' : 'A'}${id.slice(1)}`
        const changedSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
        // non-real test secret for test file
        // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
        const otherSignature = createHmac('sha256', 'another-secret')
            .update(`voip-call:v1:${id}`).digest().subarray(0, 16).toString('base64url')

        for (const invalid of [id, `${changedId}.${signature}`, `${id}.${changedSignature}`, `${id}.${otherSignature}`]) {
            expect(parseCallStatusToken(invalid)).toBeNull()
        }
        expect(kv.get).not.toHaveBeenCalled()
        expect(buildCallStatusToken('invalid-id')).toBeNull()
    })

    test('stores state by random ID and resolves both lookup directions with expiring keys', async () => {
        expect(await setCallStatus(state)).toBe('OK')
        expect(kv.set).toHaveBeenCalledTimes(2)
        for (const args of kv.set.mock.calls) {
            expect(args.slice(2)).toEqual(['EX', CALL_STATUS_TTL_IN_SECONDS])
        }
        expect(await getCallStatusById(state.id)).toEqual(state)
        expect(await getCallStatus(state)).toEqual(state)

        await setCallStatus({ ...state, status: CALL_STATUS_ENDED })
        expect(await getCallStatusById(parseCallStatusToken(buildCallStatusToken(state.id))))
            .toEqual({ ...state, status: CALL_STATUS_ENDED })
    })

    test('rejects missing, expired, corrupt and mismatched state or indexes', async () => {
        expect(await getCallStatusById(state.id)).toBeNull()
        await setCallStatus(state)
        const [stateKey, indexKey] = kv.set.mock.calls.map(([key]) => key)
        const serialized = records.get(stateKey)

        records.delete(indexKey)
        kv.get.mockClear()
        expect(await getCallStatusById(state.id)).toEqual(state)
        expect(kv.get).toHaveBeenCalledTimes(1)
        expect(kv.get).toHaveBeenCalledWith(stateKey)
        expect(await getCallStatus(state)).toBeNull()
        records.set(indexKey, state.id)
        records.delete(stateKey)
        expect(await getCallStatusById(state.id)).toBeNull()
        expect(await getCallStatus(state)).toBeNull()
        records.set(stateKey, '{')
        expect(await getCallStatusById(state.id)).toBeNull()
        records.set(stateKey, JSON.stringify({ ...state, callId: '' }))
        expect(await getCallStatusById(state.id)).toBeNull()
        records.set(stateKey, JSON.stringify({ ...state, id: generateCallStatusId() }))
        expect(await getCallStatusById(state.id)).toBeNull()
        records.set(stateKey, serialized)
        records.set(indexKey, generateCallStatusId())
        expect(await getCallStatusById(state.id)).toEqual(state)
        expect(await getCallStatus(state)).toBeNull()
    })

    test('keeps state readable by ID when the identity index is replaced', async () => {
        await setCallStatus(state)
        const replacement = { ...state, id: generateCallStatusId() }
        await setCallStatus(replacement)
        expect(await getCallStatusById(state.id)).toEqual(state)
        expect(await getCallStatusById(replacement.id)).toEqual(replacement)
        expect(await getCallStatus(state)).toEqual(replacement)
    })

    test('keeps stored state readable by ID if writing the identity index fails', async () => {
        kv.set.mockImplementationOnce(async (key, value) => {
            records.set(key, value)
            return 'OK'
        }).mockRejectedValueOnce(new Error('Redis unavailable'))

        await expect(setCallStatus(state)).rejects.toThrow('Redis unavailable')
        expect(await getCallStatusById(state.id)).toEqual(state)
        expect(await getCallStatus(state)).toBeNull()
    })

    describe('preserves call metadata', () => {
        test.each([{ panel: { id: 'panel-id' } }, 'call-reference', null, undefined])('preserves call metadata %p', async callMeta => {
            await setCallStatus({ ...state, callMeta })
            expect((await getCallStatusById(state.id)).callMeta).toEqual(callMeta)
        })
    })

    test('does not write invalid states or query Redis for invalid IDs', async () => {
        expect(await setCallStatus({ ...state, callId: '' })).toBe(false)
        expect(await setCallStatus({ ...state, id: 'invalid' })).toBe(false)
        expect(await getCallStatusById('invalid')).toBeNull()
        expect(await getCallStatus({ ...state, callId: '' })).toBeNull()
        expect(kv.set).not.toHaveBeenCalled()
        expect(kv.get).not.toHaveBeenCalled()
    })
})
