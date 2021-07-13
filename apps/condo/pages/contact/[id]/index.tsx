import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { ArrowLeftOutlined, EditFilled } from '@ant-design/icons'
import { Col, Row, Space, Typography } from 'antd'
import Head from 'next/head'
import Link from 'next/link'
import { colors } from '@condo/domains/common/constants/style'
import React from 'react'
import { useRouter } from 'next/router'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'


const FieldPairRow = (props) => {
    const {
        fieldTitle,
        fieldValue,
    } = props
    return (
        <>
            <Col span={4}>
                <Typography.Text type='secondary'>
                    {fieldTitle}
                </Typography.Text>
            </Col>
            <Col span={20} push={4}>
                <NotDefinedField value={fieldValue}/>
            </Col>
        </>
    )
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const ContactInfoPage = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const ContactNotFoundTitle = intl.formatMessage({ id: 'Contact.NotFound.Title' })
    const ContactNotFoundMessage = intl.formatMessage({ id: 'Contact.NotFound.Message' })
    const ContactLabel = intl.formatMessage({ id:'Contact' }).toLowerCase()
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitShortMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })

    const { query } = useRouter()
    const contactId = get(query, 'id', '')

    const { organization } = useOrganization()

    const {
        obj: contact,
        loading,
        error,
    } = Contact.useObject({
        where: {
            id: String(contactId),
            organization: {
                id: String(organization.id),
            },
        },
    })

    if (error || loading) {
        return <LoadingOrErrorPage title={LoadingMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (!contact) {
        return <LoadingOrErrorPage title={ContactNotFoundTitle} loading={false} error={ContactNotFoundMessage}/>
    }
    // TODO (SavelevMatthew): more complex logic for enabling Contact editing?
    const isContactEditable = true
    const contactName = get(contact, 'name')
    const contactUnitName = get(contact, 'unitName')
    const unitSuffix = contactUnitName ? `${UnitShortMessage} ${contactUnitName}` : ''
    const contactAddress = `${get(contact, ['property', 'address'], DeletedMessage)} ${unitSuffix}`

    return (
        <>
            <Head>
                <title>{contactName}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    <Row gutter={[0, 40]}>
                        <Col span={3}>
                            <UserAvatar borderRadius={24}/>
                        </Col>
                        <Col span={20} push={1}>
                            <Row gutter={[0, 60]}>
                                <Col span={16}>
                                    <Row gutter={[0, 40]}>
                                        <Col span={24}>
                                            <Typography.Title>
                                                {contactName}
                                            </Typography.Title>
                                            <Typography.Title
                                                level={2}
                                                style={{ margin: '8px 0 0', fontWeight: 400 }}
                                            >
                                                {ContactLabel}
                                            </Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <FrontLayerContainer>
                                                <Row gutter={[0, 24]}>
                                                    <FieldPairRow
                                                        fieldTitle={AddressLabel}
                                                        fieldValue={contactAddress}
                                                    />
                                                    <FieldPairRow
                                                        fieldTitle={PhoneLabel}
                                                        fieldValue={get(contact, ['phone'])}
                                                    />
                                                    <FieldPairRow
                                                        fieldTitle={EmailLabel}
                                                        fieldValue={get(contact, ['email'])}
                                                    />
                                                </Row>
                                            </FrontLayerContainer>
                                        </Col>
                                        {isContactEditable && (
                                            <Col span={24}>
                                                <Space direction={'horizontal'} size={40}>
                                                    <Link href={`/contact/${contactId}/update`}>
                                                        <Button
                                                            color={'green'}
                                                            type={'sberPrimary'}
                                                            secondary
                                                            icon={<EditFilled />}
                                                            disabled
                                                        >
                                                            {UpdateMessage}
                                                        </Button>
                                                    </Link>
                                                </Space>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()
    const BackButtonLabel = intl.formatMessage({ id: 'pages.condo.contact.PageTitle' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/contact/'}
        >
            {BackButtonLabel}
        </LinkWithIcon>
    )
}

ContactInfoPage.headerAction = <HeaderAction/>

export default ContactInfoPage