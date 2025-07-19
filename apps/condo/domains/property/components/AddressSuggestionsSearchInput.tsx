import styled from '@emotion/styled'
import { notification, Select, SelectProps } from 'antd'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'

import { ArrowLeft, Mail, Send } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useAddressApi } from '@condo/domains/common/components/AddressApi'
import { BaseSearchInput } from '@condo/domains/common/components/BaseSearchInput'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { renderHighlightedPart } from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { TSelectedAddressSuggestion } from '@condo/domains/property/components/BasePropertyForm/types'
import { validHouseTypes } from '@condo/domains/property/constants/property'


const SELECT_OPTION_STYLES: CSSProperties = { direction: 'rtl', textAlign: 'left' }
/*
    Fixes visual overlapping of close-button with text
    It cannot be extracted into global styles, because selects
    with custom components have different markup
*/
const BaseSearchInputWrapper = styled.div`
  .ant-select-allow-clear {
    &:hover {
      .ant-select-selection-search {
        /* This value fits to any size of select */
        padding-right: 24px;
      }
    }
  }
`

interface AddressSearchInputProps extends SelectProps<string> {
    setAddressValidatorError?: Dispatch<SetStateAction<string>>
    addressValidatorError?: string
}

const BACK_LINK_WRAPPER_STYLE: CSSProperties = { display: 'flex', justifyContent: 'end' }
const HELP_OPTION_WRAPPER_STYLE: CSSProperties = { width: '100%', padding: '10px 16px', display: 'flex', gap: '18px', backgroundColor: colors.gray[1], borderRadius: '8px', alignItems: 'center', justifyContent: 'space-between' }

const {
    publicRuntimeConfig: { HelpRequisites },
} = getConfig()

export const AddressSuggestionsSearchInput: React.FC<AddressSearchInputProps> = (props) => {
    const { setAddressValidatorError, addressValidatorError } = props

    const intl = useIntl()
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const AddressMetaError = intl.formatMessage({ id: 'errors.AddressMetaParse' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const NoSuchAddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.message' })
    const MessageModalTitle = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.message.title' })
    const MessageModalDescription = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.message.description' })
    const MessageModalButtonLabel = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.message.button' })
    const ContactsModalTitle = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.contacts.title' })
    const ContactsModalDescription = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.contacts.description' })
    const ContactsModalDescriptionEmail = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.contacts.description.email' })
    const ContactsModalDescriptionBot = intl.formatMessage({ id: 'pages.condo.property.field.Address.notFound.modal.contacts.description.bot' })
    const BackMessage = intl.formatMessage({ id: 'Back' })

    const SupportEmail = get(HelpRequisites, 'support_email')
    const SupportBotName = get(HelpRequisites, 'support_bot')

    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)
    useEffect(() => {
        const isAddressNotSelected = get(props, 'setAddressValidatorError') && !isMatchSelectedProperty
        if (isAddressNotSelected) {
            setAddressValidatorError(addressValidatorError)
        } else if (addressValidatorError === AddressNotSelected) {
            setAddressValidatorError(null)
        }
    }, [isMatchSelectedProperty, setAddressValidatorError])

    const { addressApi } = useAddressApi()

    const searchAddress = useCallback(
        async (query: string): Promise<TSelectedAddressSuggestion[]> => {
            try {
                const { suggestions } = await addressApi.getSuggestions(query)
                return suggestions.map(suggestion => {
                    // TODO(pahaz): we should remove isHouse and use only suggestion.type
                    // TODO(pahaz): we should drop backward compatibility check by house_type_full. Because we add `suggestion.type` check!
                    return {
                        text: suggestion.value,
                        value: suggestion.rawValue,
                        isHouse: suggestion.type === 'building' || validHouseTypes.includes(suggestion.data.house_type_full),
                    }
                })
            } catch (e) {
                console.warn('Error while trying to fetch suggestions: ', e)
                return []
            }
        },
        [],
    )

    const renderOption = useCallback(
        (dataItem: TSelectedAddressSuggestion, searchValue) => {
            return (
                <Select.Option
                    style={SELECT_OPTION_STYLES}
                    key={JSON.stringify(dataItem)}
                    value={dataItem.text}
                    title={dataItem.text}
                >
                    <TextHighlighter
                        text={dataItem.text}
                        search={searchValue}
                        renderPart={renderHighlightedPart}
                    />
                </Select.Option>
            )
        },
        [],
    )

    const handleOptionSelect = useCallback(
        (value: string, option) => {
            try {
                addressApi.cacheRawAddress(value, option.key)
            } catch (e) {
                notification.error({
                    message: ServerErrorMsg,
                    description: AddressMetaError,
                })
            }
            props.onSelect && props.onSelect(value, option)
        },
        [],
    )

    const [helpModalState, setHelpModalState] = useState<'message' | 'contacts' | null>(null)

    return (
        <>
            <BaseSearchInputWrapper>
                <BaseSearchInput
                    {...props}
                    setIsMatchSelectedProperty={setIsMatchSelectedProperty}
                    loadOptionsOnFocus={false}
                    search={searchAddress}
                    renderOption={renderOption}
                    onSelect={handleOptionSelect}
                    id='addressSuggestionsSearchInput'
                    notFoundContent={(
                        <Typography.Text
                            onClick={() => setHelpModalState('message')}
                            size='medium'
                            type='secondary'
                        >
                            {NoSuchAddressMessage}
                        </Typography.Text>
                    )}
                />
            </BaseSearchInputWrapper>
            <Modal
                open={helpModalState === 'message'}
                onCancel={() => setHelpModalState(null)}
                title={MessageModalTitle}
                footer={[
                    <Button
                        type='primary'
                        key='next'
                        onClick={() => setHelpModalState('contacts')}
                    >
                        {MessageModalButtonLabel}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {MessageModalDescription}
                </Typography.Text>
            </Modal>
            <Modal
                open={helpModalState === 'contacts'}
                onCancel={() => setHelpModalState(null)}
                title={(
                    <Space size={8} direction='vertical'>
                        <Typography.Title level={3}>{ContactsModalTitle}</Typography.Title>
                        <Typography.Text size='medium' type='secondary'>{ContactsModalDescription}</Typography.Text>
                    </Space>
                )}
                footer={[
                    <div key='back' style={BACK_LINK_WRAPPER_STYLE}>
                        <LinkWithIcon
                            PrefixIcon={ArrowLeft}
                            title={BackMessage}
                            size='large'
                            onClick={() => setHelpModalState('message')}
                        />
                    </div>,
                ]}
            >
                <Space size={8} direction='vertical' width='100%'>
                    <a href={`mailto:${SupportEmail}`} target='_blank' style={HELP_OPTION_WRAPPER_STYLE} rel='noreferrer'>
                        <Space size={16}>
                            <Mail size='medium' color={colors.gray[7]} />
                            <Typography.Text>{ContactsModalDescriptionEmail} {SupportEmail}</Typography.Text>
                        </Space>
                    </a>
                    {
                        SupportBotName && (
                            <a href={`https://t.me/${SupportBotName}`} target='_blank' style={HELP_OPTION_WRAPPER_STYLE} rel='noreferrer'>
                                <Space size={16}>
                                    <Send size='medium' color={colors.gray[7]} />
                                    <Typography.Text>{ContactsModalDescriptionBot} @{SupportBotName}</Typography.Text>
                                </Space>
                            </a>
                        )
                    }
                </Space>
            </Modal>
        </>
    )
}
