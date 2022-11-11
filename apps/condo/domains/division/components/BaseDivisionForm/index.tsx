import React, { useCallback } from 'react'
import { Col, Form, Row } from 'antd'
import { Rule } from 'rc-field-form/lib/interface'
import get from 'lodash/get'

import { Division, Organization } from '@app/condo/schema'
import { useIntl } from '@open-condo/next/intl'

import { IDivisionFormState } from '@condo/domains/division/utils/clientSchema/Division'
import Input from '@condo/domains/common/components/antd/Input'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import FormSubheader from '@condo/domains/common/components/FormSubheader'
import { GraphQlSearchInput, RenderOptionFunc } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    searchEmployee,
    searchOrganizationProperty,
} from '@condo/domains/ticket/utils/clientSchema/search'
import { FormWithAction, IFormWithActionChildren } from '@condo/domains/common/components/containers/FormList'
import { renderBlockedOption } from '@condo/domains/common/components/GraphQlSearchInput'

const LAYOUT = {
    layout: 'horizontal',
}

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        sm: 8,
        lg: 6,
    },
    wrapperCol: {
        sm: 14,
        lg: 12,
        xl: 8,
    },
}

interface IBaseDivisionFormProps {
    organization: Organization
    initialValues?: IDivisionFormState
    action?: (values: IDivisionFormState) => Promise<Division>,
    afterActionCompleted?: (division: Division) => void
    children: IFormWithActionChildren
}

const BaseDivisionForm: React.FC<IBaseDivisionFormProps> = (props) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'division.field.name' })
    const ResponsibleLabel = intl.formatMessage({ id: 'division.field.responsible' })
    const ExecutorsLabel = intl.formatMessage({ id: 'division.field.executors' })
    const PropertiesLabel = intl.formatMessage({ id: 'division.field.properties' })
    const NameRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.name.required' })
    const PropertiesRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.properties.required' })
    const ResponsibleRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.responsible.required' })
    const ExecutorsRequiredErrorMessage = intl.formatMessage({ id: 'division.validation.executors.required' })
    const ResponsibleHintTitleMessage = intl.formatMessage({ id: 'division.form.hint.responsible.title' })
    const ResponsibleHintDescriptionMessage = intl.formatMessage({ id: 'division.form.hint.responsible.description' })
    const ExecutorsHintTitleMessage = intl.formatMessage({ id: 'division.form.hint.executors.title' })
    const ExecutorsHintDescriptionMessage = intl.formatMessage({ id: 'division.form.hint.executors.description' })
    const BlockedEmployeeMessage = intl.formatMessage({ id: 'employee.isBlocked' })

    const { changeMessage, requiredValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        name: [changeMessage(requiredValidator, NameRequiredErrorMessage)],
        properties: [changeMessage(requiredValidator, PropertiesRequiredErrorMessage)],
        responsible: [changeMessage(requiredValidator, ResponsibleRequiredErrorMessage)],
        executors: [changeMessage(requiredValidator, ExecutorsRequiredErrorMessage)],
    }

    const organizationId = get(props.organization, 'id')

    const action = (variables) => {
        props.action(variables)
            .then(result => {
                if (props.afterActionCompleted) {
                    props.afterActionCompleted(result)
                }
            })
    }

    const renderOptions: (items: any[], renderOption: RenderOptionFunc) => JSX.Element[] = useCallback(
        (items, renderOption) => {
            return items.map((item) => get(item, 'isBlocked', false)
                ? renderBlockedOption(item, BlockedEmployeeMessage)
                : renderOption(item))
        }, [BlockedEmployeeMessage])

    return (
        <FormWithAction
            {...LAYOUT}
            action={action}
            initialValues={props.initialValues}
            validateTrigger={['onBlur', 'onSubmit']}
        >
            {({ handleSave, isLoading, form }) => (
                <Row gutter={[0, 24]}>
                    <Col span={24}>
                        <Form.Item
                            name='name'
                            label={NameLabel}
                            labelAlign='left'
                            rules={validations.name}
                            required
                            {...INPUT_LAYOUT_PROPS}
                        >
                            <Input/>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='properties'
                            label={PropertiesLabel}
                            labelAlign='left'
                            {...INPUT_LAYOUT_PROPS}
                            validateFirst
                            rules={validations.properties}
                            required
                        >
                            <GraphQlSearchInput
                                search={searchOrganizationProperty(organizationId)}
                                showArrow={false}
                                mode='multiple'
                                infinityScroll
                                initialValue={get(props, ['initialValues', 'properties'], [])}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <FormSubheader
                            title={ResponsibleHintTitleMessage}
                            hint={ResponsibleHintDescriptionMessage}
                        />
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='responsible'
                            label={ResponsibleLabel}
                            labelAlign='left'
                            rules={validations.responsible}
                            {...INPUT_LAYOUT_PROPS}
                            required
                        >
                            <GraphQlSearchInput
                                search={searchEmployee(organizationId, ({ role }) => (
                                    get(role, 'canBeAssignedAsResponsible', false)
                                ))}
                                showArrow={false}
                                renderOptions={renderOptions}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <FormSubheader
                            title={ExecutorsHintTitleMessage}
                            hint={ExecutorsHintDescriptionMessage}
                        />
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='executors'
                            label={ExecutorsLabel}
                            labelAlign='left'
                            rules={validations.executors}
                            {...INPUT_LAYOUT_PROPS}
                            required
                        >
                            <GraphQlSearchInput
                                search={searchEmployee(organizationId, ({ role }) => (
                                    get(role, 'canBeAssignedAsExecutor', false)
                                ))}
                                showArrow={false}
                                mode='multiple'
                                renderOptions={renderOptions}
                            />
                        </Form.Item>
                    </Col>
                    {props.children({ handleSave, isLoading, form })}
                </Row>
            )}
        </FormWithAction>
    )
}

export default BaseDivisionForm
