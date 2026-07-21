import type { B2BAppAccessRightSetPermissionsFragment } from '@/gql'

type AllowedKeys = keyof Omit<B2BAppAccessRightSetPermissionsFragment, '__typename'>

type ExhaustiveArray<T extends string, A extends T[]> =
    [T] extends [A[number]] ? A : never

function exhaustivePermissions<A extends AllowedKeys[]> (arr: ExhaustiveArray<AllowedKeys, A>): A {
    return arr
}

export type ShowedPermissions = Record<AllowedKeys, boolean>

export const SHOWED_PERMISSIONS = exhaustivePermissions([
    'canReadOrganizations',
    'canReadTickets',
    'canManageTickets',
])
