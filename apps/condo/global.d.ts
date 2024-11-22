import { GetActiveOrganizationEmployeeQuery, AuthenticatedUserQuery } from '@app/condo/gql'
import en from '@app/condo/lang/en/en.json'
import ru from '@app/condo/lang/ru/ru.json'


// NOTE: Combine all keys together
const translations = [en, ru] as const
type MessagesKeysType = keyof typeof translations[number]

type LinkExtendsType = GetActiveOrganizationEmployeeQuery['employees'][number]
type OrganizationExtendsType = GetActiveOrganizationEmployeeQuery['employees'][number]['organization']
type EmployeeExtendsType = Omit<GetActiveOrganizationEmployeeQuery['employees'][number], 'organization' | 'role'>
type RoleExtendsType = GetActiveOrganizationEmployeeQuery['employees'][number]['role']
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
        interface GetActiveOrganizationEmployeeQueryType extends GetActiveOrganizationEmployeeQuery {}
        interface LinkType extends LinkExtendsType {}
        interface OrganizationType extends OrganizationExtendsType {}
        interface EmployeeType extends EmployeeExtendsType {}
        interface RoleType extends RoleExtendsType {}
        interface UserType extends UserExtendsType {}
    }
}
