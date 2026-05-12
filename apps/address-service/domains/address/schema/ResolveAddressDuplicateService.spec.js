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

const { Address, AddressHeuristic, createTestAddress, createTestAddressHeuristic, updateTestAddress } = require('@address-service/domains/address/utils/testSchema')
const { HEURISTIC_TYPE_COORDINATES, HEURISTIC_TYPE_FIAS_ID } = require('@address-service/domains/common/constants/heuristicTypes')
const { DADATA_PROVIDER } = require('@address-service/domains/common/constants/providers')
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

        test('dismiss creates coordinate heuristic for dismissed address from its meta when it has none', async () => {
            const geoLat = faker.address.latitude()
            const geoLon = faker.address.longitude()
            const dadataMeta = {
                provider: { name: DADATA_PROVIDER, rawData: {} },
                value: 'Russia, Moscow, Lenina st, 1',
                unrestricted_value: 'Russia, Moscow, Lenina st, 1',
                data: {
                    geo_lat: geoLat,
                    geo_lon: geoLon,
                    qc_geo: '0',
                },
            }

            const [target] = await createTestAddress(adminClient, { key: `fallback:${faker.random.alphaNumeric(12)}` })
            const [dismissed] = await createTestAddress(adminClient, {
                key: `fias_id:${faker.datatype.uuid()}`,
                meta: dadataMeta,
            })

            await updateTestAddress(adminClient, dismissed.id, {
                possibleDuplicateOf: { connect: { id: target.id } },
            })

            await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: dismissed.id,
                action: 'dismiss',
            })

            const coordHeuristics = await AddressHeuristic.getAll(adminClient, {
                address: { id: dismissed.id },
                type: HEURISTIC_TYPE_COORDINATES,
                deletedAt: null,
            })
            expect(coordHeuristics).toHaveLength(1)
            expect(coordHeuristics[0].value).toEqual(`${geoLat},${geoLon}`)
            expect(coordHeuristics[0].provider).toEqual(DADATA_PROVIDER)
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

        test('merge moves non-coordinate heuristics from loser to winner', async () => {
            const { winner, duplicate } = await createLinkedAddresses(adminClient)

            const [loserHeuristic] = await createTestAddressHeuristic(adminClient, duplicate.id, {
                type: HEURISTIC_TYPE_FIAS_ID,
                value: faker.datatype.uuid(),
            })

            await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: winner.id,
            })

            const movedHeuristic = await AddressHeuristic.getOne(adminClient, { id: loserHeuristic.id })
            expect(movedHeuristic).toBeDefined()
            expect(movedHeuristic.deletedAt).toBeNull()
            expect(movedHeuristic.address.id).toEqual(winner.id)
        })

        test('merge soft-deletes loser coordinate heuristic instead of moving it', async () => {
            const { winner, duplicate } = await createLinkedAddresses(adminClient)
            const coordValue = `${faker.address.latitude()},${faker.address.longitude()}`

            const [loserCoordHeuristic] = await createTestAddressHeuristic(adminClient, duplicate.id, {
                type: HEURISTIC_TYPE_COORDINATES,
                value: coordValue,
                reliability: 90,
            })

            await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: winner.id,
            })

            const deletedHeuristic = await AddressHeuristic.getOne(adminClient, {
                id: loserCoordHeuristic.id,
                deletedAt_not: null,
            })
            expect(deletedHeuristic).toBeDefined()
            expect(deletedHeuristic.deletedAt).not.toBeNull()
            expect(deletedHeuristic.address.id).toEqual(duplicate.id)
        })

        test('merge does not overwrite existing winner coordinate heuristic', async () => {
            const { winner, duplicate } = await createLinkedAddresses(adminClient)
            const winnerCoordValue = `${faker.address.latitude()},${faker.address.longitude()}`
            const loserCoordValue = `${faker.address.latitude()},${faker.address.longitude()}`

            const [winnerCoordHeuristic] = await createTestAddressHeuristic(adminClient, winner.id, {
                type: HEURISTIC_TYPE_COORDINATES,
                value: winnerCoordValue,
                reliability: 90,
            })

            await createTestAddressHeuristic(adminClient, duplicate.id, {
                type: HEURISTIC_TYPE_COORDINATES,
                value: loserCoordValue,
                reliability: 90,
            })

            await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: winner.id,
            })

            const winnerCoordAfterMerge = await AddressHeuristic.getOne(adminClient, { id: winnerCoordHeuristic.id })
            expect(winnerCoordAfterMerge).toBeDefined()
            expect(winnerCoordAfterMerge.deletedAt).toBeNull()
            expect(winnerCoordAfterMerge.value).toEqual(winnerCoordValue)

            const winnerHeuristics = await AddressHeuristic.getAll(adminClient, {
                address: { id: winner.id },
                type: HEURISTIC_TYPE_COORDINATES,
                deletedAt: null,
            })
            expect(winnerHeuristics).toHaveLength(1)
        })

        test('merge creates coordinate heuristic for winner from its Dadata meta when winner has none', async () => {
            const geoLat = faker.address.latitude()
            const geoLon = faker.address.longitude()
            const dadataMeta = {
                provider: { name: DADATA_PROVIDER, rawData: {} },
                value: 'Russia, Moscow, Lenina st, 1',
                unrestricted_value: 'Russia, Moscow, Lenina st, 1',
                data: {
                    geo_lat: geoLat,
                    geo_lon: geoLon,
                    qc_geo: '0',
                },
            }

            const [winner] = await createTestAddress(adminClient, {
                key: `fias_id:${faker.datatype.uuid()}`,
                meta: dadataMeta,
            })
            const [duplicate] = await createTestAddress(adminClient, {
                key: `fallback:${faker.random.alphaNumeric(12)}`,
            })

            await updateTestAddress(adminClient, duplicate.id, {
                possibleDuplicateOf: { connect: { id: winner.id } },
            })

            await resolveAddressDuplicateByTestClient(adminClient, {
                addressId: duplicate.id,
                action: 'merge',
                winnerId: winner.id,
            })

            const winnerCoordHeuristics = await AddressHeuristic.getAll(adminClient, {
                address: { id: winner.id },
                type: HEURISTIC_TYPE_COORDINATES,
                deletedAt: null,
            })
            expect(winnerCoordHeuristics).toHaveLength(1)
            expect(winnerCoordHeuristics[0].value).toEqual(`${geoLat},${geoLon}`)
            expect(winnerCoordHeuristics[0].provider).toEqual(DADATA_PROVIDER)
        })
    })
})
