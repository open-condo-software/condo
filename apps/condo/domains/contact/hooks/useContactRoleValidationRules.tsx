import { Rule } from 'rc-field-form/lib/interface'
import { useIntl } from 'react-intl'
import { useValidations } from '../../common/hooks/useValidations'
import { useExistingContactRoles } from './useExistingContactRoles'

export const useContactRoleValidationRules = (): Rule[] => {
    const intl = useIntl()
    const ContactRoleIsDuplicateMessage = intl.formatMessage({ id: 'ContactRoles.error.duplicate' })

    const existingContactRoles = useExistingContactRoles()

    const { trimValidator } = useValidations()
    const contactRoleValidator = (existingRoles: Set<string>): Rule => ({
        validator: (_, value) => {
            const normalizedValue = value && value.trim()
            if (normalizedValue &&
                (existingRoles.has(normalizedValue) || normalizedValue.startsWith('contact.role')))
                return Promise.reject(ContactRoleIsDuplicateMessage)
            return Promise.resolve()
        },
    })

    return [trimValidator, contactRoleValidator(existingContactRoles)]
}