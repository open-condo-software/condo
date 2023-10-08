import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback } from 'react'

import { Edit } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { FieldPairRow as BaseFieldPairRow, FieldPairRowProps } from '@condo/domains/common/components/FieldPairRow'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import  { TicketCardList } from '@condo/domains/common/components/TicketCard/TicketCardList'
import { fontSizes } from '@condo/domains/common/constants/style'
import { ContactsReadPermissionRequired } from '@condo/domains/contact/components/PageAccess'
import { Contact } from '@condo/domains/contact/utils/clientSchema'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'


const VALUE_FIELD_WRAPPER_STYLE = { width: '100%' }
const CONTACT_FIELD_PAIR_PROPS: Partial<FieldPairRowProps> = {
    titleColProps: { span: 8 },
    valueColProps: { span: 16, style: VALUE_FIELD_WRAPPER_STYLE },
}

const FieldPairRow: React.FC<FieldPairRowProps> = (props) => (
    <BaseFieldPairRow
        {...CONTACT_FIELD_PAIR_PROPS}
        {...props}
    />
)

const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }

export const ContactPageContent = ({ contact, isContactEditable, softDeleteAction, phonePrefix = '' }) => {
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
    const ContactRoleTitle = intl.formatMessage({ id: 'ContactRole' })
    const VerifiedMessage = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })

    const contactId = get(contact, 'id', null)
    const contactName = get(contact, 'name')
    const contactEmail = get(contact, 'email', '')
    const contactPhone = get(contact, 'phone', '')
    const contactUnitName = get(contact, 'unitName')
    const contactUnitType = get(contact, 'unitType', BuildingUnitSubType.Flat)
    const unitSuffix = contactUnitName
        ? `${intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${contactUnitType}` }).toLowerCase()} ${contactUnitName}`
        : ''
    const contactAddress = `${get(contact, ['property', 'address'], DeletedMessage)} ${unitSuffix}`
    const contactRole = get(contact, 'role')
    const isVerified = get(contact, 'isVerified')

    const { breakpoints } = useLayoutContext()

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
                <Row gutter={[0, 40]}>
                    <Col xs={10} lg={3}>
                        <UserAvatar borderRadius={24}/>
                    </Col>
                    <Col xs={24} lg={20} offset={!breakpoints.DESKTOP_SMALL ? 0 : 1}>
                        <Row gutter={[0, 20]}>
                            <Col xs={24} lg={15}>
                                <Row gutter={[0, 40]}>
                                    <Col span={24}>
                                        <Typography.Title>
                                            {contactName}
                                        </Typography.Title>
                                        <Typography.Title
                                            level={2}
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
                                                    fieldValue={contactPhone}
                                                    href={`tel:${phonePrefix ? 
                                                        `${phonePrefix}${contactPhone}` : contactPhone}`}
                                                />
                                                {
                                                    contactEmail && <FieldPairRow
                                                        fieldTitle={EmailLabel}
                                                        fieldValue={contactEmail}
                                                        href={`mailto:${contactEmail}`}
                                                    />
                                                }
                                                <FieldPairRow
                                                    fieldTitle={ContactRoleTitle}
                                                    fieldValue={get(contactRole, 'name', '—')}
                                                />
                                                <>
                                                    <Col span={8}>
                                                        <Typography.Text type='secondary'>
                                                            {VerifiedMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col span={16}>
                                                        <Checkbox
                                                            checked={isVerified}
                                                            disabled={!isVerified}
                                                            style={CHECKBOX_STYLE}
                                                        />
                                                    </Col>
                                                </>
                                            </Row>
                                        </FrontLayerContainer>
                                    </Col>
                                    {isContactEditable && breakpoints.DESKTOP_SMALL && (
                                        <Col span={24}>
                                            <ActionBar
                                                actions={[
                                                    <Link key='update' href={`/contact/${get(contact, 'id')}/update`}>
                                                        <Button
                                                            type='primary'
                                                            icon={<Edit size='medium' />}
                                                        >
                                                            {UpdateMessage}
                                                        </Button>
                                                    </Link>,
                                                    <DeleteButtonWithConfirmModal
                                                        key='delete'
                                                        title={ConfirmDeleteTitle}
                                                        message={ConfirmDeleteMessage}
                                                        okButtonLabel={ConfirmDeleteButtonLabel}
                                                        action={deleteCallback}
                                                        buttonContent={DeleteMessage}
                                                    />,
                                                ]}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </Col>
                            <Col xs={24} sm={24} lg={8} offset={!breakpoints.DESKTOP_SMALL ? 0 : 1}>
                                <TicketCardList
                                    contactId={contactId}
                                />
                            </Col>
                            {isContactEditable && !breakpoints.DESKTOP_SMALL && (
                                <Col span={24}>
                                    <ActionBar
                                        actions={[
                                            <Link key='update' href={`/contact/${get(contact, 'id')}/update`}>
                                                <Button
                                                    type='primary'
                                                    icon={<Edit size='medium' />}
                                                >
                                                    {UpdateMessage}
                                                </Button>
                                            </Link>,
                                            <DeleteButtonWithConfirmModal
                                                key='delete'
                                                title={ConfirmDeleteTitle}
                                                message={ConfirmDeleteMessage}
                                                okButtonLabel={ConfirmDeleteButtonLabel}
                                                action={deleteCallback}
                                                buttonContent={DeleteMessage}
                                            />,
                                        ]}
                                    />
                                </Col>
                            )}
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

    const isContactEditable = get(link, ['role', 'canManageContacts'], null)

    return (
        <ContactPageContent
            contact={contact}
            isContactEditable={isContactEditable}
            softDeleteAction={handleDeleteAction}
        />
    )
}

ContactInfoPage.requiredAccess = ContactsReadPermissionRequired

export default ContactInfoPage
