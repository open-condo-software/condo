export type GetCurrentUserData = {
    userId: string
    userType: 'staff' | 'resident'
    userContextEntity: 'Organization' | 'Resident'
    userContextEntityId: string
}