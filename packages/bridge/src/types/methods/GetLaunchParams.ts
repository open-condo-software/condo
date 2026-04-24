export type GetLaunchParamsParams = Record<string, never>

// TODO(DOMA-5154): Add sign here to validate all this params
export type GetLaunchParamsData = {
    condoUserId: string | null
    condoUserType: 'staff' | 'resident'
    condoContextEntity: 'Organization' | 'Resident'
    condoContextEntityId: string | null
    condoLocale: string
    condoDeviceId: string
}