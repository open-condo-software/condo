import React, { useCallback } from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { EditFilled } from '@ant-design/icons'
import { Col, Row, Space, Typography } from 'antd'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import  { TicketCardList } from '@condo/domains/common/components/TicketCard/TicketCardList'
import { canManageContacts } from '@condo/domains/organization/permissions'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { BuildingUnitSubType } from '@app/condo/schema'

const FieldPairRow = (props) => {
    const {
        fieldTitle,
        fieldValue,
    } = props
    return (
        <>
            <Col span={8}>
                <Typography.Text type='secondary'>
                    {fieldTitle}
                </Typography.Text>
            </Col>
            <Col span={16} style={{ width: '100%' }}>
                <NotDefinedField value={fieldValue}/>
            </Col>
        </>
    )
}

export const ContactPageContent = ({ contact, isContactEditable, softDeleteAction }) => {
    const intl = useIntl()
    const ContactLabel = intl.formatMessage({ id:'Contact' }).toLowerCase()
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'Delete' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'contact.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'contact.ConfirmDeleteMessage' })

    const contactId = get(contact, 'id', null)
    const contactName = get(contact, 'name')
    const contactEmail = get(contact, 'email', '')
    const contactUnitName = get(contact, 'unitName')
    const contactUnitType = get(contact, 'unitType', BuildingUnitSubType.Flat)
    const unitSuffix = contactUnitName
        ? `${intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${contactUnitType}` }).toLowerCase()} ${contactUnitName}`
        : ''
    const contactAddress = `${get(contact, ['property', 'address'], DeletedMessage)} ${unitSuffix}`

    const { isSmall } = useLayoutContext()

    const deleteCallback = useCallback(() => {
        return new Promise((resolve) => {
            resolve(softDeleteAction(contact))
        })
    }, [softDeleteAction, contact])

    return (
        <>
            <Head>
                <title>{contactName}</title>
            </Head>
            <PageWrapper>
                <Row gutter={[0, 40]} justify={'center'}>
                    <Col xs={10} lg={3}>
                        <UserAvatar borderRadius={24}/>
                    </Col>
                    <Col xs={24} lg={20} offset={isSmall ? 0 : 1}>
                        <Row gutter={[0, 60]}>
                            <Col lg={15} xs={24}>
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
                                                {
                                                    contactEmail && <FieldPairRow
                                                        fieldTitle={EmailLabel}
                                                        fieldValue={get(contact, ['email'])}
                                                    />
                                                }
                                            </Row>
                                        </FrontLayerContainer>
                                    </Col>
                                    {isContactEditable && (
                                        <Col span={24}>
                                            <Space direction={'horizontal'} size={40}>
                                                <Link href={`/contact/${get(contact, 'id')}/update`}>
                                                    <Button
                                                        color={'green'}
                                                        type={'sberPrimary'}
                                                        secondary
                                                        icon={<EditFilled />}
                                                    >
                                                        {UpdateMessage}
                                                    </Button>
                                                </Link>
                                                <DeleteButtonWithConfirmModal
                                                    title={ConfirmDeleteTitle}
                                                    message={ConfirmDeleteMessage}
                                                    okButtonLabel={ConfirmDeleteButtonLabel}
                                                    action={deleteCallback}
                                                />
                                            </Space>
                                        </Col>
                                    )}
                                </Row>
                            </Col>
                            <Col xs={24} lg={8} offset={isSmall ? 0 : 1}>
                                <TicketCardList
                                    contactId={contactId}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </PageWrapper>
        </>
    )
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const ContactInfoPage = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const ContactNotFoundTitle = intl.formatMessage({ id: 'Contact.NotFound.Title' })
    const ContactNotFoundMessage = intl.formatMessage({ id: 'Contact.NotFound.Message' })

    const { query, push } = useRouter()
    const contactId = get(query, 'id', '')

    const { organization, link } = useOrganization()

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

    const handleDeleteAction = Contact.useSoftDelete(() => push('/contact/'))

    if (error || loading) {
        return <LoadingOrErrorPage title={LoadingMessage} loading={loading} error={error ? ErrorMessage : null}/>
    }
    if (!contact) {
        return <LoadingOrErrorPage title={ContactNotFoundTitle} loading={false} error={ContactNotFoundMessage}/>
    }

    const isContactEditable = canManageContacts(link, contact)

    return (
        <ContactPageContent
            contact={contact}
            isContactEditable={isContactEditable}
            softDeleteAction={handleDeleteAction}
        />
    )
}

ContactInfoPage.requiredAccess = OrganizationRequired

export default ContactInfoPage
