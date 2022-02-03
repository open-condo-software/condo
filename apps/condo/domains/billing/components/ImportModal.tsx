import React, { useCallback, useState } from 'react'
import { Modal, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { css, Global } from '@emotion/core'
import { IFrame } from '@condo/domains/common/components/IFrame'
import getConfig from 'next/config'

const { publicRuntimeConfig: { registryImportUrl } } = getConfig()

interface IImportModalProps {
    visible: boolean
    onClose: () => void
}

const WideModalStyles = css`
  .registry-import-modal {
    max-width: 1200px;
    width: calc(100% - 40px) !important;
    & > .ant-modal-content > .ant-modal-body {
      width: 100%;
    }
  }
`

export const ImportModal: React.FC<IImportModalProps> = ({
    visible,
    onClose,
}) => {
    const intl = useIntl()

    const [modalClosable, setModalClosable] = useState(true)

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const {
        obj: context,
    } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: { id: organizationId },
            deletedAt: null,
        },
    })

    const optionId = get(context, 'integrationOption', null)
    const options = get(context, ['integration', 'availableOptions', 'options'], [])
    const [option] = options.filter(opt => opt.name === optionId)
    const optionName = get(option, 'displayName', optionId)

    const lockModalHandler = useCallback((message) => {
        const messageType = get(message, 'type')
        if (messageType !== 'ModalLock') return
        const locked = Boolean(get(message, 'locked', true))
        setModalClosable(!locked)
    }, [])

    const ModalTitle = intl.formatMessage({ id: 'RegistriesUploading' }, { name: optionName })
    return (
        <>
            <Global styles={WideModalStyles}/>
            <Modal
                visible={visible}
                onCancel={(e) => {
                    e.preventDefault()
                    if (modalClosable) {
                        onClose()
                    }
                }}
                footer={null}
                closable={modalClosable}
                title={<Typography.Title level={4}>{ModalTitle}</Typography.Title>}
                centered
                className={'registry-import-modal'}
                style={{ marginTop:40 }}
            >
                <IFrame pageUrl={registryImportUrl} handlers={[lockModalHandler]}/>
            </Modal>
        </>
    )
}