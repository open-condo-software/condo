import { UserTypeType } from '@app/condo/schema'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { normalizeEmail } from '@condo/domains/common/utils/mail'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { User } from '@condo/domains/user/utils/clientSchema'


type IUseEmployeeValidations = (organizationId: string, currentEmployeeId?: string) => Record<string, Rule>

export const useEmployeeValidations: IUseEmployeeValidations = (organizationId, currentEmployeeId) => {
    const intl = useIntl()
    const PhoneIsNotValidMsg = intl.formatMessage({ id: 'global.input.error.wrongMobilePhone' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const UserAlreadyInListMsg = intl.formatMessage({ id: 'pages.users.UserIsAlreadyInList' })

    const { objs: employees } = OrganizationEmployee.useObjects(
        {
            where: {
                organization: { id: organizationId },
                isRejected: false,
                isBlocked: false,
            },
        },
        { fetchPolicy: 'network-only' },
    )

    const { refetch: searchUsers } = User.useObjects({}, { fetchPolicy: 'network-only', skip: true })

    const alreadyRegisteredPhoneValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            const normalizedPhone = normalizePhone(value)
            if (!normalizedPhone) return Promise.reject(PhoneIsNotValidMsg)

            const { data: { objs } } = await searchUsers({
                where: {
                    phone: String(normalizedPhone),
                    type: UserTypeType.Staff,
                },
            })
            const userIds = isArray(objs)
                ? objs.map(user => get(user, 'id')).filter(Boolean)
                : []

            const alreadyInList = employees.some(employee => {
                if (currentEmployeeId && get(employee, 'id') === currentEmployeeId) return false

                return userIds.some(id => id === get(employee, 'user.id')) || get(employee, 'phone') === normalizedPhone
            })

            if (alreadyInList) return Promise.reject(UserAlreadyInListMsg)

            return Promise.resolve()
        },
    }), [PhoneIsNotValidMsg, UserAlreadyInListMsg, currentEmployeeId, employees])

    const alreadyRegisteredEmailValidator: Rule = useMemo(() => ({
        validator: async (_, value) => {
            if (isEmpty(value)) return Promise.resolve()

            const normalizedEmail = normalizeEmail(value)
            if (!normalizedEmail) return Promise.reject(EmailIsNotValidMsg)

            const { data: { objs } } = await searchUsers({
                where: {
                    email: String(value),
                    type: UserTypeType.Staff,
                },
            })
            const userIds = isArray(objs)
                ? objs.map(user => get(user, 'id')).filter(Boolean)
                : []

            const alreadyInList = employees.some(employee => {
                if (currentEmployeeId && get(employee, 'id') === currentEmployeeId) return false

                return userIds.some(id => id === get(employee, 'user.id')) || get(employee, 'email') === normalizedEmail
            })

            if (alreadyInList) return Promise.reject(UserAlreadyInListMsg)

            return Promise.resolve()
        },
    }), [EmailIsNotValidMsg, UserAlreadyInListMsg, currentEmployeeId, employees])

    return useMemo(() => ({
        alreadyRegisteredPhoneValidator,
        alreadyRegisteredEmailValidator,
    }), [alreadyRegisteredEmailValidator, alreadyRegisteredPhoneValidator])
}
