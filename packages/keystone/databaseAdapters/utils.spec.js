const { parseDatabaseUrl, parseDatabaseMapping, matchPattern, matchDatabase } = require('./utils')

function getBillingCaseDatabaseMapping () {
    const databases = parseDatabaseUrl('custom:{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/billing"}')
    const mapping = parseDatabaseMapping('[{"match":"Billing*","query":"billing","command":"billing"},{"match":"*","query":"default","command":"default"}]', databases)
    return { mapping, databases }
}

describe('parseDatabaseUrl', () => {
    test('real case 1', () => {
        const data = 'custom:{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const result = parseDatabaseUrl(data)
        expect(result).toMatchSnapshot()
    })

    test('no custom prefix', () => {
        const data = '{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const result = parseDatabaseUrl(data)
        expect(result).toMatchSnapshot()
    })

    test('wrong type', () => {
        const data = { 'default': 'postgresql://postgres@127.0.0.1/main', 'billing': 'postgresql://postgres@127.0.0.1/main' }
        const result = parseDatabaseUrl(data)
        expect(result).toMatchSnapshot()
    })

    test('wrong json 1', () => {
        const data = '{"default":1,"billing":"postgresql://postgres@127.0.0.1/main"}'
        const result = parseDatabaseUrl(data)
        expect(result).toMatchSnapshot()
    })
    test('wrong json 2', () => {
        const data = '{"default":ng":"postgresql://postgres@127.0.0.1/main"}'
        const result = parseDatabaseUrl(data)
        expect(result).toMatchSnapshot()
    })
})

describe('parseDatabaseMapping', () => {
    test('real case 1', () => {
        const data = 'custom:{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const databases = parseDatabaseUrl(data)
        const mapping = '[{"match":"Billing*","query":"billing","command":"default"},{"match":"*","query":"default","command":"default"}]'
        const result = parseDatabaseMapping(mapping, databases)
        expect(result).toMatchSnapshot()
    })

    test('wrong json type', () => {
        const data = 'custom:{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const databases = parseDatabaseUrl(data)
        const mapping = '{"match":"Billing*","query":"billing","command":"default"}'
        const result = parseDatabaseMapping(mapping, databases)
        expect(result).toBeUndefined()
    })

    test('no default match', () => {
        const data = 'custom:{"default":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const databases = parseDatabaseUrl(data)
        const mapping = '[{"match":"Billing*","query":"billing","command":"billing"},{"match":"Xx*","query":"default","command":"default"}]'
        const result = parseDatabaseMapping(mapping, databases)
        expect(result).toBeUndefined()
    })

    test('wrong database name', () => {
        const data = 'custom:{"XX":"postgresql://postgres@127.0.0.1/main","billing":"postgresql://postgres@127.0.0.1/main"}'
        const databases = parseDatabaseUrl(data)
        const mapping = '[{"match":"Billing*","query":"billing","command":"billing"},{"match":"Xx*","query":"default","command":"default"}]'
        const result = parseDatabaseMapping(mapping, databases)
        expect(result).toBeUndefined()
    })
})

describe('matchPattern', () => {
    test('False', () => {
        expect(matchPattern('Billing*', 'User')).toBeFalsy()
        expect(matchPattern('B*User', 'User')).toBeFalsy()
        expect(matchPattern('u*', 'User')).toBeFalsy()
        expect(matchPattern('B*User', '')).toBeFalsy()
        expect(matchPattern('', 'User')).toBeFalsy()
    })
    test('Truth', () => {
        expect(matchPattern('Billing*', 'Billing')).toBeTruthy()
        expect(matchPattern('Billing*', 'BillingContext')).toBeTruthy()
        expect(matchPattern('U*', 'User')).toBeTruthy()
        expect(matchPattern('*', 'User')).toBeTruthy()
        expect(matchPattern('**', 'User')).toBeTruthy()
        expect(matchPattern('', '')).toBeTruthy()
        expect(matchPattern('User', 'User')).toBeTruthy()
        expect(matchPattern('User&$]', 'User&$]')).toBeTruthy()
        expect(matchPattern('U()ser&$]', 'U()ser&$]')).toBeTruthy()
        expect(matchPattern('U()se*r&$]', 'U()ser&$]')).toBeTruthy()
    })
    test('Complex', () => {
        expect(matchPattern('User*Ticket*Time', 'User')).toBeFalsy()
        expect(matchPattern('User*Ticket*Time', 'UserTicketTime')).toBeTruthy()
        expect(matchPattern('User*Ticket*Time', 'UserCommentTicketTime')).toBeTruthy()
        expect(matchPattern('User*Ticket*Time', 'UserCommentTicketReadTime')).toBeTruthy()
    })
})

describe('matchDatabase', () => {
    test('Match', () => {
        const { mapping } = getBillingCaseDatabaseMapping()
        expect(matchDatabase(mapping, 'BillingReceipt')).toEqual({ 'match': 'Billing*', 'query': 'billing', 'command': 'billing' })
        expect(matchDatabase(mapping, 'AcquiringContext')).toEqual({ 'match': '*', 'query': 'default', 'command': 'default' })
    })
})
