import React, { useCallback, useRef } from 'react'
import { Columns, RowNormalizer, RowValidator, ObjectCreator } from '@condo/domains/common/utils/importer'
import { Modal, Popover, Typography, Space } from 'antd'
import { useImporter } from '@condo/domains/common/hooks/useImporter'
import { useIntl } from '@core/next/intl'
import { ModalContext, getUploadSuccessModalConfig, getUploadErrorModalConfig, getUploadProgressModalConfig } from './ModalConfigs'
import { DataImporter } from '../DataImporter'
import styled from '@emotion/styled'

interface IColumnsInfoBoxProps {
    columns: Columns
}

interface IImportProps {
    objectsName: string
    accessCheck: boolean
    onFinish(): boolean
    columns: Columns
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
}

const InfoBoxContainer = styled.div`
  max-width: 300px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const ColumnsInfoBox: React.FC<IColumnsInfoBoxProps> = ({ columns }) => {
    const intl = useIntl()
    const ColumnsFormatMessage = intl.formatMessage({ id: 'ImportRequiredColumnsFormat' })
    return (
        <Space direction={'vertical'} size={10}>
            <Typography.Text>
                {ColumnsFormatMessage}
            </Typography.Text>
            <InfoBoxContainer>
                {
                    columns.map((column, index) => {
                        return (
                            <>
                                {index !== 0 && ', '}
                                <Typography.Text keyboard key={column.name}>
                                    {column.name}
                                </Typography.Text>
                            </>
                        )
                    })
                }
            </InfoBoxContainer>
        </Space>
    )
}

export const ImportWrapper: React.FC<IImportProps> = (props) => {
    const {
        objectsName,
        accessCheck,
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
        onFinish } = props
    const intl = useIntl()
    const ImportTitle = intl.formatMessage({ id:'Import' })
    const ImportSuccessMessage = intl.formatMessage({ id: 'ImportSuccess' },  { objects: objectsName })
    const ImportOKMessage = intl.formatMessage({ id: 'Continue' })
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const ImportProcessingMessage = intl.formatMessage({ id:'ImportProcessing' })
    const ImportBreakButtonMessage = intl.formatMessage({ id:'Break' })
    const [modal, contextHolder] = Modal.useModal()
    const activeModal = useRef(null)

    const destroyActiveModal = () => {
        if (activeModal.current) {
            activeModal.current.destroy()
            activeModal.current = null
        }
    }
    const [importData, progress, error, isImported, breakImport] = useImporter(
        columns, rowNormalizer, rowValidator, objectCreator,
        () => {
            destroyActiveModal()
            const config = getUploadSuccessModalConfig(ImportTitle, ImportSuccessMessage, ImportOKMessage)
            activeModal.current = modal.success(config)
            onFinish()
        },
        () => {
            destroyActiveModal()
            const config = getUploadErrorModalConfig(ImportTitle, ImportDefaultErrorMessage, ImportOKMessage)
            activeModal.current = modal.error(config)
        }
    )

    const handleUpload = useCallback((file) => {
        destroyActiveModal()
        const config = getUploadProgressModalConfig(ImportTitle, ImportProcessingMessage, ImportBreakButtonMessage,
            () => {
                breakImport()
                onFinish()
            })
        // @ts-ignore
        activeModal.current = modal.info(config)
        importData(file.data)
    }, [])

    return (
        accessCheck && (
            <ModalContext.Provider value={{ progress, error, isImported }}>
                <DataImporter onUpload={handleUpload}>
                    <Popover title={ImportTitle} content={<ColumnsInfoBox columns={columns}/>}>
                        {props.children}
                    </Popover>
                </DataImporter>
                {contextHolder}
            </ModalContext.Provider>
        )
    )
}