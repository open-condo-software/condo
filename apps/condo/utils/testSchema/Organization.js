const faker = require('faker')
const { makeClientWithNewRegisteredAndLoggedInUser } = require('@condo/domains/user/utils/testSchema')
const {
    OrganizationEmployee,
    REGISTER_NEW_ORGANIZATION_MUTATION,
    ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION,
    INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION,
    REINVITE_ORGANIZATION_EMPLOYEE_MUTATION,
} = require('@condo/domains/organization/gql')

async function createOrganizationEmployee (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!extraAttrs.organization) throw new Error('no extraAttrs.organization')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const email = faker.internet.email().toLowerCase()

    const attrs = {
        dv: 1,
        sender, email,
        ...extraAttrs,
    }
    const obj = await OrganizationEmployee.create(client, attrs)
    return [obj, attrs]
}

async function registerNewOrganization (client, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }
    const country = 'ru'
    const name = faker.company.companyName()
    const description = faker.company.catchPhrase()
    const meta = {
        dv: 1, inn: '6670428515', kpp: '667001001', city: faker.address.city(), zipCode: faker.address.zipCode(),
        street: faker.address.streetName(), number: faker.address.secondaryAddress(),
        county: faker.address.county(),
    }

    const attrs = {
        dv: 1,
        sender,
        country, name, description, meta,
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(REGISTER_NEW_ORGANIZATION_MUTATION, {
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function inviteNewOrganizationEmployee (client, organization, user, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    if (!organization) throw new Error('no organization')
    if (!user) throw new Error('no user')
    if (!user.email) throw new Error('no user.email')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        email: user.email,
        phone: user.phone,
        name: user.name,
        organization: { id: organization.id },
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(INVITE_NEW_ORGANIZATION_EMPLOYEE_MUTATION, {
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function reInviteNewOrganizationEmployee (client, organization, user, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    if (!organization) throw new Error('no organization')
    if (!user) throw new Error('no user')
    if (!user.email) throw new Error('no user.email')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        email: user.email,
        phone: user.phone,
        organization: { id: organization.id },
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(REINVITE_ORGANIZATION_EMPLOYEE_MUTATION, {
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function acceptOrRejectOrganizationInviteById (client, invite, extraAttrs = {}, { raw = false } = {}) {
    if (!client) throw new Error('no client')
    if (!invite || !invite.id) throw new Error('no invite.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1, sender,
        isAccepted: true,
        isRejected: false,
        ...extraAttrs,
    }

    const { data, errors } = await client.mutate(ACCEPT_OR_REJECT_ORGANIZATION_INVITE_BY_ID_MUTATION, {
        id: invite.id,
        data: { ...attrs },
    })
    if (raw) return { data, errors }
    expect(errors).toEqual(undefined)
    return [data.obj, attrs]
}

async function makeClientWithRegisteredOrganization () {
    const client = await makeClientWithNewRegisteredAndLoggedInUser()
    const [organization] = await registerNewOrganization(client)
    client.organization = organization
    return client
}

module.exports = {
    registerNewOrganization,
    createOrganizationEmployee,
    inviteNewOrganizationEmployee,
    reInviteNewOrganizationEmployee,
    acceptOrRejectOrganizationInviteById,
    makeClientWithRegisteredOrganization,
}