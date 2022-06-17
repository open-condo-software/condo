import { Alert, Col, Form, Input, Row, Typography } from 'antd'
import { flatten, get, isEmpty } from 'lodash'
import { Rule } from 'rc-field-form/lib/interface'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'

import { useIntl } from '@core/next/intl'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Select from '@condo/domains/common/components/antd/Select'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { Loader } from '@condo/domains/common/components/Loader'
import { colors } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import { searchOrganizationProperty } from '../../utils/clientSchema/search'
import { Property } from '../../../property/utils/clientSchema'
import { TicketHint } from '../../utils/clientSchema'

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

const HINT_LINK_STYLES: CSSProperties = { color: colors.black, textDecoration: 'underline' }

const TicketHintAlert = () => {
    const intl = useIntl()
    const AlertMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.title' })
    const AlertContent = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.content' })
    const ShowHintsMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.showHints' })

    const AlertDescription = useMemo(() => (
        <>
            <Typography.Paragraph style={{ margin: 0 }}>{AlertContent}</Typography.Paragraph>
            <a href={'/settings?tab=hint'} target={'_blank'} rel="noreferrer">
                <Typography.Link style={HINT_LINK_STYLES}>
                    {ShowHintsMessage}
                </Typography.Link>
            </a>
        </>
    ), [AlertContent, ShowHintsMessage])

    return (
        <Alert
            message={AlertMessage}
            description={AlertDescription}
            showIcon
            type={'warning'}
        />
    )
}

export const BaseTicketHintForm = ({ children, action, organizationId, initialValues, mode }) => {
    const intl = useIntl()
    const ApartmentComplexNameMessage  = intl.formatMessage({ id: 'ApartmentComplexName' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const AddALlPropertiesMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.addAllProperties' })

    const { requiredValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        properties: [requiredValidator],
        content: [requiredValidator],
    }
    const { objs: properties, loading: propertiesLoading } = Property.useObjects({
        where: {
            organization: { id: organizationId },
        },
    })
    const { objs: ticketHints, loading: hintsLoading } = TicketHint.useObjects({
        where: {
            organization: { id: organizationId },
        },
    })

    const [editorValue, setEditorValue] = useState('')

    const handleEditorChange = useCallback((newValue, form) => {
        setEditorValue(newValue)
        form.setFieldsValue({ content: newValue })
    }, [])

    const propertiesWithTicketHint = useMemo(() => flatten(ticketHints.map(hint => hint.properties.map(property => property.id))),
        [ticketHints])
    const propertiesWithoutTicketHint = useMemo(() =>  properties.filter(property => !propertiesWithTicketHint.includes(property.id)),
        [properties, propertiesWithTicketHint])
    const options = useMemo(() =>
        propertiesWithoutTicketHint
            .map(property => ({ label: property.address, value: property.id })),
    [propertiesWithoutTicketHint])
    const optionValues = useMemo(() => options.map(option => option.value),
        [options])

    const handleCheckboxChange = useCallback((e, form) => {
        const checkboxValue = e.target.checked

        if (checkboxValue) {
            form.setFieldsValue({ properties: optionValues })
        } else {
            form.setFieldsValue({ properties: [] })
        }
    }, [optionValues])

    if (propertiesLoading || hintsLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    return (
        <Row gutter={[0, 40]}>
            {
                mode === 'create' && !isEmpty(propertiesWithTicketHint) && (
                    <Col span={24}>
                        <TicketHintAlert />
                    </Col>
                )
            }
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValues}
                    action={action}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 25]}>
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
                                            {
                                                mode === 'create' ? (
                                                    <Select
                                                        options={options}
                                                        mode={'multiple'}
                                                        disabled={!organizationId}
                                                    />
                                                ) : (
                                                    <GraphQlSearchInput
                                                        disabled={!organizationId}
                                                        search={searchOrganizationProperty(organizationId)}
                                                        showArrow={false}
                                                        mode="multiple"
                                                        infinityScroll
                                                        initialValue={get(initialValues, ['initialValues', 'properties'], [])}
                                                    />
                                                )
                                            }
                                        </Form.Item>
                                    </Col>
                                    {
                                        mode === 'create' && (
                                            <Col offset={6} span={24}>
                                                <Checkbox
                                                    disabled={!organizationId}
                                                    onChange={e => handleCheckboxChange(e, form)}>
                                                    {AddALlPropertiesMessage}
                                                </Checkbox>
                                            </Col>
                                        )
                                    }
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name={'name'}
                                    label={ApartmentComplexNameMessage}
                                    labelAlign={'left'}
                                    labelCol={{
                                        sm: 6,
                                    }}
                                    wrapperCol= {{
                                        sm: 8,
                                    }}
                                >
                                    <Input disabled={!organizationId} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Row>
                                    <Col span={6}>
                                        <Form.Item
                                            name={'content'}
                                            label={HintMessage}
                                            labelAlign={'left'}
                                            rules={validations.content}
                                            required
                                            wrapperCol={{ span: 0 }}
                                        />
                                    </Col>
                                    <Col span={14}>
                                        <Editor
                                            apiKey={'c9hkjseuh8rfim0yiqr6q2zrzb8k12vyoc1dclkml7e9ozg5'}
                                            disabled={!organizationId}
                                            value={editorValue}
                                            onEditorChange={(newValue) => handleEditorChange(newValue, form)}
                                            initialValue={initialValues.content}
                                            init={{
                                                link_title: false,
                                                contextmenu: false,
                                                menubar: false,
                                                statusbar: false,
                                                plugins: 'link',
                                                toolbar: 'undo redo | ' +
                                                    'link | bold italic backcolor | alignleft aligncenter ' +
                                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                                    'removeformat',
                                            }}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                            {children({ handleSave, isLoading, form })}
                        </Row>
                    )}
                </FormWithAction>
            </Col>
        </Row>
    )
}