import { GetActiveOrganizationEmployeeQuery, AuthenticatedUserQuery } from '@app/condo/gql'
import en from '@app/condo/lang/en/en.json'
import ru from '@app/condo/lang/ru/ru.json'


// NOTE: Combine all keys together
const translations = [en, ru] as const
type MessagesKeysType = keyof typeof translations[number]

type LinkExtendsType = GetActiveOrganizationEmployeeQuery['employees'][number]
type OrganizationExtendsType = GetActiveOrganizationEmployeeQuery['employees'][number]['organization']
type EmployeeExtendsType = Omit<GetActiveOrganizationEmployeeQuery['employees'][number], 'organization' | 'role'>
type RoleExtendsType = Pick<GetActiveOrganizationEmployeeQuery['employees'][number], 'role'>
type UserExtendsType = AuthenticatedUserQuery['authenticatedUser']

declare global {
    // NOTE: Override global interface allows us to use autocomplete in intl
    namespace FormatjsIntl {
        interface Message {
            ids: MessagesKeysType
        }
    }

    // NOTE: Override global interface allows us to use autocomplete in useOrganization/useAuth from '@open-condo/next'
    namespace OpenCondoNext {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface GetActiveOrganizationEmployeeQueryType extends GetActiveOrganizationEmployeeQuery {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface LinkType extends LinkExtendsType {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface OrganizationType extends OrganizationExtendsType {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface EmployeeType extends EmployeeExtendsType {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface RoleType extends RoleExtendsType {}

        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface UserType extends UserExtendsType {}
    }
}
