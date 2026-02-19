/**
 * @jest-environment node
 */

const index = require('@app/address-service/index')
const { faker } = require('@faker-js/faker')
const gql = require('graphql-tag')

const { throwIfError } = require('@open-condo/codegen/generate.test.utils')
const {
    makeClient,
    makeLoggedInAdminClient,
    makeLoggedInClient,
    expectToThrowAccessDeniedErrorToResult,
    expectToThrowAuthenticationErrorToResult,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { Address, createTestAddress } = require('@address-service/domains/address/utils/testSchema')
const { makeClientWithSupportUser } = require('@address-service/domains/user/utils/testSchema')

const RESOLVE_ADDRESS_DUPLICATE_MUTATION = gql`
    mutation resolveAddressDuplicate ($data: ResolveAddressDuplicateInput!) {
        result: resolveAddressDuplicate(data: $data) { status }
    }
`

async function resolveAddressDuplicateByTestClient (client, input) {
    const attrs = {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        ...input,
    }

    const { data, errors } = await client.mutate(RESOLVE_ADDRESS_DUPLICATE_MUTATION, { data: attrs })
    throwIfError(data, errors)

    return [data.result, attrs]
}

async function createLinkedAddresses (client) {
    const [winner] = await createTestAddress(client, { key: `fallback:${faker.random.alphaNumeric(12)}` })
    const [duplicate] = await createTestAddress(client, { key: `fallback:${faker.random.alphaNumeric(12)}` })

    await Address.update(client, duplicate.id, {
        dv: 1,
        sender: { dv: 1, fingerprint: faker.random.alphaNumeric(8) },
        possibleDuplicateOf: { connect: { id: winner.id } },
    })

    return { winner, duplicate }
}

describe('ResolveAddressDuplicateService', () => {
    let adminClient
    let supportClient
    let userClient
    let anonymousClient

    setFakeClientMode(index)

    beforeAll(async () => {
        adminClient = await makeLoggedInAdminClient()
        supportClient = await makeClientWithSupportUser()
        userClient = await makeLoggedInClient()
        anonymousClient = await makeClient()
    })

    describe('access', () => {
        test('anonymous cannot execute', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            await expectToThrowAuthenticationErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(anonymousClient, {
                    addressId: duplicate.id,
                    action: 'dismiss',
                })
            })
        })

        test('regular user cannot execute', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            await expectToThrowAccessDeniedErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(userClient, {
                    addressId: duplicate.id,
                    action: 'dismiss',
                })
            })
        })

        test('admin can execute', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            const [result] = await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'dismiss',
            })

            expect(result).toEqual({ status: 'dismissed' })
        })

        test('support can execute', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            const [result] = await resolveAddressDuplicateByTestClient(supportClient, {
                addressId: duplicate.id,
                action: 'dismiss',
            })

            expect(result).toEqual({ status: 'dismissed' })
        })
    })

    describe('validation', () => {
        test('throws if address does not exist', async () => {
            await expect(resolveAddressDuplicateByTestClient(adminClient, {
                addressId: faker.datatype.uuid(),
                action: 'dismiss',
            })).rejects.toThrow(/not found/)
        })

        test('throws if address has no possibleDuplicateOf', async () => {
            const [address] = await createTestAddress(adminClient)

            await expect(resolveAddressDuplicateByTestClient(adminClient, {
                addressId: address.id,
                action: 'dismiss',
            })).rejects.toThrow(/has no possibleDuplicateOf set/)
        })

        test('throws for unknown action', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            await expect(resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'unknown',
            })).rejects.toThrow(/Unknown action/)
        })

        test('throws for merge without winnerId', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            await expect(resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
            })).rejects.toThrow(/winnerId is required/)
        })

        test('throws if winnerId is not one of duplicate candidates', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)
            const [wrongWinner] = await createTestAddress(adminClient)

            await expect(resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: wrongWinner.id,
            })).rejects.toThrow(/winnerId must be either/)
        })
    })

    describe('logic', () => {
        test('dismiss clears possibleDuplicateOf', async () => {
            const { winner, duplicate } = await createLinkedAddresses(adminClient)

            const [result] = await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'dismiss',
            })

            expect(result).toEqual({ status: 'dismissed' })

            const updatedDuplicate = await Address.getOne(adminClient, { id: duplicate.id })
            expect(updatedDuplicate).toBeDefined()
            expect(updatedDuplicate.possibleDuplicateOf).toBeNull()

            const winnerAfterDismiss = await Address.getOne(adminClient, { id: winner.id })
            expect(winnerAfterDismiss).toBeDefined()
        })

        test('merge soft-deletes loser and keeps winner', async () => {
            const { winner, duplicate } = await createLinkedAddresses(adminClient)

            const [result] = await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: winner.id,
            })

            expect(result).toEqual({ status: 'merged' })

            const winnerAfterMerge = await Address.getOne(adminClient, { id: winner.id })
            const loserAfterMerge = await Address.getOne(adminClient, { id: duplicate.id })

            expect(winnerAfterMerge).toBeDefined()
            expect(loserAfterMerge).not.toBeDefined()
        })
    })
})
