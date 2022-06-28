import { Alert, Col, Form, Input, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { get, isEmpty } from 'lodash'
import getConfig from 'next/config'
import { Rule } from 'rc-field-form/lib/interface'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'

import { useIntl } from '@core/next/intl'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Loader } from '@condo/domains/common/components/Loader'
import { colors } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    searchOrganizationProperty,
    searchOrganizationPropertyWithoutPropertyHint,
} from '@condo/domains/ticket/utils/clientSchema/search'

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
const TEXT_STYLES: CSSProperties = { margin: 0 }

const TicketPropertyHintAlert = () => {
    const intl = useIntl()
    const AlertMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.title' })
    const AlertContent = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.content' })
    const ShowHintsMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.alert.showHints' })

    const AlertDescription = useMemo(() => (
        <>
            <Typography.Paragraph style={TEXT_STYLES}>{AlertContent}</Typography.Paragraph>
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

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]
const SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 25]
const APARTMENT_COMPLEX_NAME_FIELD_PROPS = {
    labelCol: {
        sm: 6,
    },
    wrapperCol:{
        sm: 8,
    },
}
const HINT_CONTENT_FIELD_LAYOUT_PROPS = {
    wrapperCol: { span: 0 },
}

const {
    publicRuntimeConfig,
} = getConfig()

const { TinyMceApiKey } = publicRuntimeConfig

export const BaseTicketPropertyHintForm = ({ children, action, organizationId, initialValues, mode }) => {
    const intl = useIntl()
    const NameMessage  = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const HintMessage = intl.formatMessage({ id: 'Hint' })
    const BuildingsMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })

    const editor_init_values = useMemo(() => ({
        link_title: false,
        contextmenu: '',
        menubar: false,
        elementpath: false,
        plugins: 'link autolink lists',
        toolbar: 'undo redo | ' +
            'link | bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat',
        link_default_target: '_blank',
        link_target_list: false,
        language: intl.locale,
    }), [intl.locale])

    const { requiredValidator } = useValidations()
    const validations: { [key: string]: Rule[] } = {
        properties: [requiredValidator],
        content: [requiredValidator],
    }

    const [editorValue, setEditorValue] = useState('')
    const [editorLoading, setEditorLoading] = useState(true)

    const initialContent = useMemo(() => get(initialValues, 'content'), [initialValues])

    const { objs: organizationTicketPropertyHintProperties, loading: organizationTicketPropertyHintPropertiesLoading } =
        TicketPropertyHintProperty.useObjects({
            where: {
                organization: { id: organizationId },
            },
        })
    const createTicketPropertyHintPropertyAction = TicketPropertyHintProperty.useCreate({}, () => Promise.resolve())
    const softDeleteTicketPropertyHintPropertyAction = TicketPropertyHintProperty.useSoftDelete({}, () => Promise.resolve())

    const initialProperties = useMemo(() => {
        const initialTicketPropertyHintId = get(initialValues, 'id')

        return initialTicketPropertyHintId ?
            organizationTicketPropertyHintProperties
                .filter(ticketPropertyHintProperty => ticketPropertyHintProperty.ticketPropertyHint.id === initialTicketPropertyHintId)
                .map(ticketPropertyHintProperty => ticketPropertyHintProperty.property) : []
    }, [initialValues, organizationTicketPropertyHintProperties])

    const initialPropertyIds = useMemo(() => {
        return initialProperties.map(property => property.id)
    }, [initialProperties])

    const initialValuesWithProperties = { ...initialValues, properties: initialPropertyIds }

    const propertiesWithTicketPropertyHint = useMemo(() => organizationTicketPropertyHintProperties.map(ticketPropertyHintProperty => ticketPropertyHintProperty.property),
        [organizationTicketPropertyHintProperties])

    const propertiesWithTicketPropertyHintIds = useMemo(() => propertiesWithTicketPropertyHint.map(property => property.id), [propertiesWithTicketPropertyHint])

    const handleEditorChange = useCallback((newValue, form) => {
        setEditorValue(newValue)
        form.setFieldsValue({ content: newValue })
    }, [])

    const handleEditorLoad = useCallback(() => setEditorLoading(false), [])

    const handleFormSubmit = useCallback(async (values) => {
        const { properties, ...otherValues } = values
        const initialTicketPropertyHintId = get(initialValues, 'id')

        if (!initialTicketPropertyHintId) {
            const ticketPropertyHint = await action({ ...otherValues, organization: organizationId })

            for (const propertyId of properties) {
                await createTicketPropertyHintPropertyAction({ organization: organizationId, ticketPropertyHint: ticketPropertyHint.id, property: propertyId })
            }
        } else {
            const ticketPropertyHint = await action({ ...otherValues })

            for (const propertyId of properties) {
                if (!initialPropertyIds.includes(propertyId)) {
                    await createTicketPropertyHintPropertyAction({ organization: organizationId, ticketPropertyHint: ticketPropertyHint.id, property: propertyId })
                }
            }

            for (const initialPropertyId of initialPropertyIds) {
                if (!properties.includes(initialPropertyId)) {
                    const ticketPropertyHintProperty = organizationTicketPropertyHintProperties
                        .find(
                            ticketPropertyHintProperty => ticketPropertyHintProperty.property.id === initialPropertyId &&
                                ticketPropertyHintProperty.ticketPropertyHint.id === initialTicketPropertyHintId
                        )

                    await softDeleteTicketPropertyHintPropertyAction({}, ticketPropertyHintProperty)
                }
            }
        }
    }, [action, createTicketPropertyHintPropertyAction, initialPropertyIds, initialValues, organizationId, organizationTicketPropertyHintProperties, softDeleteTicketPropertyHintPropertyAction])

    if (organizationTicketPropertyHintPropertiesLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            {
                mode === 'create' && !isEmpty(propertiesWithTicketPropertyHint) && (
                    <Col span={24}>
                        <TicketPropertyHintAlert />
                    </Col>
                )
            }
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValuesWithProperties}
                    action={handleFormSubmit}
                    {...LAYOUT}
                >
                    {({ handleSave, isLoading, form }) => (
                        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
                            <Col span={24}>
                                <Row gutter={SMALL_VERTICAL_GUTTER}>
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
                                                disabled={!organizationId}
                                                initialValueSearch={searchOrganizationProperty(organizationId)}
                                                initialValue={initialPropertyIds}
                                                search={searchOrganizationPropertyWithoutPropertyHint(organizationId, propertiesWithTicketPropertyHintIds)}
                                                showArrow={false}
                                                mode="multiple"
                                                infinityScroll
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    name={'name'}
                                    label={NameMessage}
                                    labelAlign={'left'}
                                    {...APARTMENT_COMPLEX_NAME_FIELD_PROPS}
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
                                            {...HINT_CONTENT_FIELD_LAYOUT_PROPS}
                                        />
                                    </Col>
                                    <Col span={14}>
                                        {editorLoading && <Loader />}
                                        <Editor
                                            onLoadContent={handleEditorLoad}
                                            apiKey={TinyMceApiKey}
                                            disabled={!organizationId}
                                            value={editorValue}
                                            onEditorChange={(newValue) => handleEditorChange(newValue, form)}
                                            initialValue={initialContent}
                                            init={editor_init_values}
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