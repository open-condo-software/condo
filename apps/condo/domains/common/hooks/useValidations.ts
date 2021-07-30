import { useIntl } from '@core/next/intl'
import { Rule } from 'rc-field-form/lib/interface'
const { normalizePhone } = require('@condo/domains/common/utils/phone')

type CombinerParams = Array<Rule | Array<Rule>>

type ValidatorHookReturnType = {
    combiner: (...rules: CombinerParams) => Rule[]
    messageChanger: (rule: Rule, message: string) => Rule
    requiredValidator: Rule
    phoneValidator: Rule
    emailValidator: Rule
}

const combiner = (...rules: CombinerParams) => {
    return rules.map(rulesPart => Array.isArray(rulesPart) ? rulesPart : [rulesPart]).flat()
}

const messageChanger = (rule: Rule, message: string) => {
    return { ...rule, message }
}

export const useValidations: () => ValidatorHookReturnType = () => {
    const intl = useIntl()
    const ThisFieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })

    const requiredValidator: Rule = {
        required: true,
        message: ThisFieldIsRequiredMessage,
    }

    const phoneValidator: Rule = {
        validator: (_, value) => {
            const v = normalizePhone(value)
            if (!v) return Promise.reject(PhoneIsNotValidMessage)
            return Promise.resolve()
        },
    }

    const emailValidator: Rule = {
        type: 'email',
        message: EmailErrorMessage,
    }

    return {
        combiner,
        messageChanger,
        requiredValidator,
        phoneValidator,
        emailValidator,
    }
}