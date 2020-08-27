const { getCookieSecret } = require('./keystone.utils')

test('getCookieSecret()', () => {
    const adapter = getCookieSecret('awfafawfawfmongawfmongo@127.0awf1/awfin?fthSoafrce=admin')
    expect(adapter).toEqual('awfafawfawfmongawfmongo@127.0awf1/awfin?fthSoafrce=admin')
})

test('getCookieSecret() short', () => {
    const adapter = getCookieSecret('q122')
    expect(adapter).toEqual('445a5981-c27f-5f08-8284-bc38de8c1f4d')
})

test('getCookieSecret() undefined', () => {
    const adapter = getCookieSecret('undefined')
    expect(adapter).toMatch(/^[a-z0-9-]{36}$/)
})
