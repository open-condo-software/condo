jest.mock('@open-condo/keystone/logging', () => ({
    getLogger: jest.fn().mockReturnValue({ warn: jest.fn() }),
}))

const { getLogger } = require('@open-condo/keystone/logging')

const { getDv, getSender } = require('./voipRequestMetadata')

const logger = getLogger()
const uuid = '31935ae4-5a69-4c15-b91b-376dc72c1d49'

describe('VoIP request metadata', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('defaults dv to numeric 1', () => {
        expect(getDv({})).toBe(1)
    })

    test.each([1, 2, 0, null, undefined, false, '1'])('preserves explicit dv %p for downstream validation', dv => {
        expect(getDv({ dv })).toBe(dv)
    })

    test.each([
        { value: `${uuid}-app.client`, fingerprint: uuid },
        { value: `${uuid}-app-client-with-hyphens`, fingerprint: uuid },
        { value: `${uuid}-suffix with invalid fingerprint characters`, fingerprint: uuid },
        { value: `${uuid.toUpperCase()}-APP.CLIENT`, fingerprint: uuid.toUpperCase() },
        { value: uuid, fingerprint: uuid },
        { value: `${uuid}-`, fingerprint: `${uuid}-` },
        { value: 'ordinary-client', fingerprint: 'ordinary-client' },
        { value: 'abcde', fingerprint: 'abcde' },
        { value: 'a'.repeat(42), fingerprint: 'a'.repeat(42) },
        { value: 'a'.repeat(100), fingerprint: 'a'.repeat(42) },
        { value: `z${uuid.slice(1)}-app.client`, fingerprint: `z${uuid.slice(1)}-app.client`.slice(0, 42) },
        { value: `prefix-${uuid}-app.client`, fingerprint: `prefix-${uuid}-app.client`.slice(0, 42) },
    ])('derives fingerprint from $value', ({ value, fingerprint }) => {
        const sender = getSender({ headers: { 'x-remote-client': value } }, {})

        expect(sender).toEqual({ dv: 1, fingerprint })
        expect(logger.warn).not.toHaveBeenCalled()
    })

    test.each([
        { name: 'missing', value: undefined, reason: 'missing' },
        { name: 'empty', value: '', reason: 'invalid' },
        { name: 'one character', value: 'a', reason: 'invalid' },
        { name: 'two characters', value: 'ab', reason: 'invalid' },
        { name: 'three characters', value: 'abc', reason: 'invalid' },
        { name: 'short', value: 'abcd', reason: 'invalid' },
        { name: 'spaces', value: 'bad client', reason: 'invalid' },
        { name: 'leading whitespace', value: ' valid-client', reason: 'invalid' },
        { name: 'trailing whitespace', value: 'valid-client ', reason: 'invalid' },
        { name: 'invalid punctuation', value: 'bad"client', reason: 'invalid' },
        { name: 'non-ASCII', value: 'клиент', reason: 'invalid' },
        { name: 'array', value: ['valid-client'], reason: 'invalid' },
        { name: 'null', value: null, reason: 'invalid' },
        { name: 'number', value: 123456, reason: 'invalid' },
    ])('logs and uses a default for $name remote client', ({ value, reason }) => {
        expect(getSender({ headers: { 'x-remote-client': value } }, {}))
            .toEqual({ dv: 1, fingerprint: 'voip-rest' })
        expect(logger.warn).toHaveBeenCalledTimes(1)
        expect(logger.warn).toHaveBeenCalledWith({
            msg: 'Using default VoIP sender',
            data: { source: 'x-remote-client', reason },
        })
    })

    test.each([
        { dv: 1, fingerprint: 'explicit-client' },
        { dv: 2, fingerprint: 'a' },
        {}, null, undefined, false,
    ])('preserves explicit sender %p without reading headers or logging', sender => {
        const req = {
            get headers () {
                throw new Error('Headers should not be read')
            },
        }

        expect(getSender(req, { sender })).toBe(sender)
        expect(logger.warn).not.toHaveBeenCalled()
    })

    test('ignores obsolete metadata headers', () => {
        const req = {
            headers: {
                'x-dv': 'not JSON',
                'x-sender': 'not JSON',
                'x-remote-client': `${uuid}-app.client`,
            },
        }

        expect(getDv({})).toBe(1)
        expect(getSender(req, {})).toEqual({ dv: 1, fingerprint: uuid })
        expect(logger.warn).not.toHaveBeenCalled()
    })

    test('returns independent default sender objects', () => {
        const first = getSender({ headers: {} }, {})
        first.fingerprint = 'changed'

        expect(getSender({ headers: {} }, {})).toEqual({ dv: 1, fingerprint: 'voip-rest' })
    })
})
