import type { B2BAppAccessRightSetPermissionsFragment } from '@/gql'

export type PermissionGroup = 'organization' | 'property' | 'contact' | 'ticket' | 'meter' | 'payment' | 'billing' | 'custom'

export type ShowedPermissions = keyof Omit<B2BAppAccessRightSetPermissionsFragment, '__typename'>
export type GroupedPermissions = Record<PermissionGroup, Array<ShowedPermissions>>
export type Singular<T extends string> = T extends `${infer R}ies`
    ? `${R}y`
    : T extends `${infer R}s`
        ? R
        : T

type PermissionEntityName<T extends ShowedPermissions> =
    T extends `canRead${infer R}`
        ? Uncapitalize<Singular<R>>
        : T extends `canManage${infer R}`
            ? Uncapitalize<Singular<R>>
            : T extends `canExecute${infer R}`
                ? R
                : never

export type ListOrMutation<T extends ShowedPermissions> =
    T extends `canExecute${string}`
        ? { entityType: 'mutation', entity: PermissionEntityName<T> }
        : { entityType: 'list', entity: PermissionEntityName<T> }

export const GROUPED_PERMISSIONS: GroupedPermissions = {
    organization: [
        'canReadOrganizations',
        'canReadOrganizationEmployees',
        'canReadOrganizationEmployeeRoles',
    ],
    property: [
        'canReadProperties',
        'canManageProperties',
    ],
    contact: [
        'canReadContacts',
        'canManageContacts',
    ],
    ticket: [
        'canReadTickets',
        'canManageTickets',
        'canReadTicketFiles',
        'canManageTicketFiles',
        'canReadTicketComments',
        'canManageTicketComments',
        'canReadTicketCommentFiles',
        'canManageTicketCommentFiles',
    ],
    meter: [
        'canReadMeters',
        'canManageMeters',
        'canReadMeterReadings',
        'canManageMeterReadings',
        'canReadMeterReportingPeriods',
        'canManageMeterReportingPeriods',
    ],
    payment: [
        'canReadInvoices',
        'canManageInvoices',
        'canReadPayments',
    ],
    billing: [
        'canReadBillingReceipts',
        'canReadBillingReceiptFiles',
    ],
    custom: [
        'canReadCustomValues',
        'canManageCustomValues',
    ],
} as const
