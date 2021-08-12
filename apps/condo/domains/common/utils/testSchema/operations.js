const faker = require('faker')

export async function softDelete (Schema, client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        deletedAt: 'true',
        ...extraAttrs,
    }
    const obj = await Schema.update(client, id, attrs)
    return [obj, attrs]
}
