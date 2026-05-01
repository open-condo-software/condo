export type RentalLifecycleAction = 'checkIn' | 'renew' | 'transfer' | 'checkOut' | 'cancel'

export function getOccupancyLifecycleActions (status?: string | null, canManageProperties = false): RentalLifecycleAction[] {
    if (!canManageProperties) return []

    return [
        ...(status === 'planned' ? ['checkIn' as const] : []),
        'renew',
        'transfer',
        'checkOut',
        ...(status === 'planned' ? ['cancel' as const] : []),
    ]
}

export function getRentalWorkspaceActions (canManageProperties = false): string[] {
    return canManageProperties ? ['createUnit', 'checkIn'] : []
}
