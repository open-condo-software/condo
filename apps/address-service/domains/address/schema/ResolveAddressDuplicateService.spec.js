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
    expectToThrowGQLErrorToResult,
    setFakeClientMode,
} = require('@open-condo/keystone/test.utils')

const { Address, createTestAddress, updateTestAddress } = require('@address-service/domains/address/utils/testSchema')
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
            const missingAddressId = faker.datatype.uuid()

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: missingAddressId,
                    action: 'dismiss',
                })
            }, {
                code: 'NOT_FOUND',
                type: 'ADDRESS_NOT_FOUND',
                message: `Address ${missingAddressId} not found`,
                mutation: 'resolveAddressDuplicate',
            })
        })

        test('throws if address has no possibleDuplicateOf', async () => {
            const [address] = await createTestAddress(adminClient)

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: address.id,
                    action: 'dismiss',
                })
            }, {
                code: 'BAD_USER_INPUT',
                type: 'NO_POSSIBLE_DUPLICATE_OF',
                message: `Address ${address.id} has no possibleDuplicateOf set`,
                mutation: 'resolveAddressDuplicate',
            })
        })

        test('throws if target address is soft-deleted', async () => {
            const { duplicate, winner } = await createLinkedAddresses(adminClient)
            await updateTestAddress(adminClient, winner.id, { deletedAt: new Date().toISOString() })

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: duplicate.id,
                    action: 'dismiss',
                })
            }, {
                code: 'BAD_USER_INPUT',
                type: 'TARGET_MISSING_OR_SOFT_DELETED',
                message: `Target Address ${winner.id} is missing or soft-deleted`,
                mutation: 'resolveAddressDuplicate',
            })
        })

        test('throws for unknown action', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)
            const action = 'unknown'

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: duplicate.id,
                    action,
                })
            }, {
                code: 'BAD_USER_INPUT',
                type: 'UNKNOWN_ACTION',
                message: `Unknown action: ${action}. Must be "merge" or "dismiss"`,
                mutation: 'resolveAddressDuplicate',
            })
        })

        test('throws for merge without winnerId', async () => {
            const { duplicate } = await createLinkedAddresses(adminClient)

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: duplicate.id,
                    action: 'merge',
                })
            }, {
                code: 'BAD_USER_INPUT',
                type: 'WINNER_ID_REQUIRED',
                message: 'winnerId is required for merge action',
                mutation: 'resolveAddressDuplicate',
            })
        })

        test('throws if winnerId is not equal to possibleDuplicateOf target', async () => {
            const { duplicate, winner } = await createLinkedAddresses(adminClient)

            await expectToThrowGQLErrorToResult(async () => {
                await resolveAddressDuplicateByTestClient(adminClient, {
                    addressId: duplicate.id,
                    action: 'merge',
                    winnerId: duplicate.id,
                })
            }, {
                code: 'BAD_USER_INPUT',
                type: 'WINNER_ID_MUST_EQUAL_TARGET',
                message: `winnerId must be equal to possibleDuplicateOf (${winner.id})`,
                mutation: 'resolveAddressDuplicate',
            })
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
