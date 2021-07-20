import { DiffOutlined } from '@ant-design/icons'
import { Alert, Modal, Progress } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useRef } from 'react'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { DataImporter } from '@condo/domains/common/components/DataImporter'
import { useImporterFunctions } from '../hooks/useImporterFunctions'
import { useImporter } from '@condo/domains/common/hooks/useImporter'

const ModalContext = React.createContext({ progress: 0, error: null, isImported: false })

const getPropertyUploadInfoModalConfig = (intl, onButtonClick) => {
    return {
        // TODO(Dimitreee):add translations
        title: intl.formatMessage({ id: 'property.Import' }),
        closable: false,
        content: (
            <ModalContext.Consumer>
                {
                    ({ progress }) => {
                        return (
                            <>
                                <Progress
                                    format={(percent) => Math.floor(percent) + '%'}
                                    percent={progress}
                                    status={'active'}
                                />
                                <Alert
                                    style={{ marginTop: 16 }}
                                    // TODO(Dimitreee): add translations
                                    message={intl.formatMessage({ id: 'property.Processing' })}
                                    type='info'
                                />
                            </>
                        )
                    }
                }
            </ModalContext.Consumer>
        ),
        okText: intl.formatMessage({ id: 'property.Break' }),
        onOk: onButtonClick,
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
    }
}

const getPropertyUploadSuccessModalConfig = (intl) => {
    return {
        // TODO(Dimitreee):add translations
        title: intl.formatMessage({ id: 'property.Import' }),
        closable: true,
        content: (
            <Alert
                style={{ marginTop: 16 }}
                // TODO(Dimitreee): add translations
                message={intl.formatMessage({ id: 'property.ImportSuccess' })}
                type='success'
            />
        ),
        okText: intl.formatMessage({ id: 'property.Continue' }),
    }
}

const getPropertyUploadErrorModalConfig = (intl) => {
    return {
        // TODO(Dimitreee):add translations
        title: intl.formatMessage({ id: 'property.Import' }),
        closable: true,
        content: (
            <ModalContext.Consumer>
                {
                    ({ error }) => {
                        const errorMessage = get(error, 'message') || intl.formatMessage({ id: 'property.ImportError' })

                        return (
                            <Alert
                                style={{ marginTop: 16 }}
                                // TODO(Dimitreee): add translations
                                message={errorMessage}
                                type='error'
                            />
                        )
                    }
                }
            </ModalContext.Consumer>
        ),
        okText: intl.formatMessage({ id: 'property.Continue' }),
    }
}

interface IPropertyImport {
    onFinish(): boolean
}

export const PropertyImport: React.FC<IPropertyImport> = (props) => {
    const userOrganization = useOrganization()
    const intl = useIntl()
    const [modal, contextHolder] = Modal.useModal()
    const activeModal = useRef(null)

    const destroyActiveModal = () => {
        if (activeModal.current) {
            activeModal.current.destroy()
            activeModal.current = null
        }
    }

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()
    const [importData, progress, error, isImported, breakImport] = useImporter(
        columns, propertyNormalizer, propertyValidator, propertyCreator,
        () => {
            destroyActiveModal()
            const config = getPropertyUploadSuccessModalConfig(intl)
            activeModal.current = modal.success(config)

            props.onFinish()
        },
        () => {
            destroyActiveModal()
            const config = getPropertyUploadErrorModalConfig(intl)
            activeModal.current = modal.error(config)
        },
    )

    const handleUpload = useCallback((file) => {
        destroyActiveModal()
        const config = getPropertyUploadInfoModalConfig(
            intl,
            () => {
                breakImport()
                props.onFinish()
            }
        )
        // @ts-ignore
        activeModal.current = modal.info(config)

        importData(file.data)
    }, [])

    const canManageProperties = get(userOrganization, ['link', 'role', 'canManageProperties'], false)

    return (
        canManageProperties && (
            <ModalContext.Provider value={{ progress, error, isImported }}>
                <DataImporter onUpload={handleUpload}>
                    <Button
                        type={'sberPrimary'}
                        icon={<DiffOutlined />}
                        secondary
                    />
                </DataImporter>
                {contextHolder}
            </ModalContext.Provider>
        )
    )
}
