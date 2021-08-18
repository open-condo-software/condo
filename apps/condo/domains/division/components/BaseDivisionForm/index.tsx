import React from 'react'
import { IDivisionFormState, IDivisionUIState } from '@condo/domains/division/utils/clientSchema/Division'
import { Form, Input } from 'antd'
import { useIntl } from '@core/next/intl'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { Rule } from 'rc-field-form/lib/interface'
import FormSubheader from '@condo/domains/common/components/FormSubheader'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { get } from 'lodash'
import {
    searchEmployee,
    searchOrganizationProperty,
} from '@condo/domains/ticket/utils/clientSchema/search'
import { FormWithAction, IFormWithActionChildren } from '../../../common/components/containers/FormList'
import { Organization } from '../../../../schema'

const LAYOUT = {
    layout: 'horizontal',
}

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 10,
    },
    style: {
        paddingBottom: '24px',
    },
}


interface IBaseDivisionFormProps {
    organization: Organization
    initialValues?: IDivisionFormState
    action?: (values: IDivisionFormState) => Promise<IDivisionUIState>,
    afterActionCompleted?: (division: IDivisionUIState) => void
    children: IFormWithActionChildren
}

const BaseDivisionForm: React.FC<IBaseDivisionFormProps> = (props) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'division.field.name' })
    const ResponsibleLabel = intl.formatMessage({ id: 'division.field.responsible' })
    const ExecutorsLabel = intl.formatMessage({ id: 'division.field.executors' })
    const PropertiesLabel = intl.formatMessage({ id: 'division.field.properties' })
    const PropertiesRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.properties.required' })
    const ResponsibleRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.responsible.required' })
    const ResponsibleHintTitleMessage = intl.formatMessage({ id: 'division.form.hint.responsible.title' })
    const ResponsibleHintDescriptionMessage = intl.formatMessage({ id: 'division.form.hint.responsible.description' })
    const ExecutorsHintTitleMessage = intl.formatMessage({ id: 'division.form.hint.executors.title' })
    const ExecutorsHintDescriptionMessage = intl.formatMessage({ id: 'division.form.hint.executors.description' })

    const { changeMessage, requiredValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        properties: [changeMessage(requiredValidator, PropertiesRequiredErrorMessage)],
        responsible: [changeMessage(requiredValidator, ResponsibleRequiredErrorMessage)],
    }

    const organizationId = get(props.organization, 'id')

    const { action: _action } = props

    const action = async (variables) => {
        const result = await _action(variables)
        if (props.afterActionCompleted) {
            return props.afterActionCompleted(result)
        }
        return result
    }

    return (
        <FormWithAction
            {...LAYOUT}
            action={action}
            initialValues={props.initialValues}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            {({ handleSave, isLoading, form }) => (
                <>
                    <Form.Item
                        name={'name'}
                        label={NameLabel}
                        labelAlign={'left'}
                        {...INPUT_LAYOUT_PROPS}
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        name={'properties'}
                        label={PropertiesLabel}
                        labelAlign={'left'}
                        {...INPUT_LAYOUT_PROPS}
                        validateFirst
                        rules={validations.properties}
                        required
                    >
                        <GraphQlSearchInput
                            search={searchOrganizationProperty(organizationId)}
                            showArrow={false}
                            mode="multiple"
                        />
                    </Form.Item>
                    <FormSubheader
                        title={ResponsibleHintTitleMessage}
                        hint={ResponsibleHintDescriptionMessage}
                    />
                    <Form.Item
                        name={'responsible'}
                        label={ResponsibleLabel}
                        labelAlign={'left'}
                        {...INPUT_LAYOUT_PROPS}
                        required
                    >
                        <GraphQlSearchInput
                            search={searchEmployee(organizationId)}
                            showArrow={false}
                        />
                    </Form.Item>
                    <FormSubheader
                        title={ExecutorsHintTitleMessage}
                        hint={ExecutorsHintDescriptionMessage}
                    />
                    <Form.Item
                        name={'executors'}
                        label={ExecutorsLabel}
                        labelAlign={'left'}
                        {...INPUT_LAYOUT_PROPS}
                    >
                        <GraphQlSearchInput
                            search={searchEmployee(organizationId)}
                            showArrow={false}
                            mode="multiple"
                        />
                    </Form.Item>
                    {props.children({ handleSave, isLoading, form })}
                </>
            )}
        </FormWithAction>
    )
}

export default BaseDivisionForm