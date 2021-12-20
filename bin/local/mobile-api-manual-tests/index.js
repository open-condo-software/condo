const { CondoUser, AddressAPI } = require('./init')
const { getAll, signIn } = require('./utils')

const {
    TicketStatus,
    TicketClassifierRule,
} = require('@condo/domains/ticket/gql.js')

const { Resident } = require('@condo/domains/resident/gql.js')

async function bootstrap () {
    console.log('User:', { endpoint: CondoUser.endpoint, user: CondoUser.user })
    await signIn(CondoUser)

    // const statuses = await getAll(CondoUser.client, TicketStatus)
    // const classifiers = await getAll(CondoUser.client, TicketClassifierRule)
    // // const resident = await getAll(CondoUser.client, Resident)
    //
    // console.log('statuses:', statuses.length)
    // console.log('classifiers:', classifiers.length)
    // // console.log('resident:', resident)

    const addressMeta = await AddressAPI.getSuggestions(CondoUser.user.address)

    console.log('CondoUser.user:', CondoUser.user)
    console.log('addressMeta:', addressMeta)

    return
}

bootstrap().catch(error => {
    console.error(error)
    process.exit(1)
})
