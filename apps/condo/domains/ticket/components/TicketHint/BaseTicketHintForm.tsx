import { Col, Form, Input, Row, Typography } from 'antd'
import { get } from 'lodash'
import { Rule } from 'rc-field-form/lib/interface'
import React from 'react'
import { useIntl } from '@core/next/intl'
import { FormWithAction } from '../../../common/components/containers/FormList'
import { GraphQlSearchInput } from '../../../common/components/GraphQlSearchInput'
import { useValidations } from '../../../common/hooks/useValidations'
import { searchOrganizationProperty } from '../../utils/clientSchema/search'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol: {
        sm: 14,
    },
}

const LAYOUT = {
    layout: 'horizontal',
}

export const BaseTicketHintForm = ({ children, action, organization, initialValues }) => {
    const intl = useIntl()
    const ApartmentComplexNameMessage  = intl.formatMessage({ id: 'ApartmentComplexName' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })

    const { requiredValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        properties: [requiredValidator],
        content: [requiredValidator],
    }

    const organizationId = get(organization, 'id')

    return (
        <FormWithAction
            action={action}
            {...LAYOUT}
        >
            {({ handleSave, isLoading, form }) => (
                <Row gutter={[0, 40]}>
                    <Col span={24}>
                        <Form.Item
                            name={'properties'}
                            label={BuildingsMessage}
                            labelAlign={'left'}
                            validateFirst
                            rules={validations.properties}
                            required
                            {...INPUT_LAYOUT_PROPS}
                        >
                            <GraphQlSearchInput
                                search={searchOrganizationProperty(organizationId)}
                                showArrow={false}
                                mode="multiple"
                                infinityScroll
                                initialValue={get(initialValues, 'properties', [])}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name={'name'}
                            label={ApartmentComplexNameMessage}
                            labelAlign={'left'}
                            {...INPUT_LAYOUT_PROPS}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name={'content'}
                            label={HintMessage}
                            labelAlign={'left'}
                            rules={validations.content}
                            required
                            {...INPUT_LAYOUT_PROPS}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    {children({ handleSave, isLoading, form })}
                </Row>
            )}
        </FormWithAction>
    )
}