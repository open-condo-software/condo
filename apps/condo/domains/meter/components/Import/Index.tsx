import isFunction from 'lodash/isFunction'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import XLSX from 'xlsx'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { ActiveModalType, BaseImportWrapper } from '@condo/domains/common/components/Import/BaseImportWrapper'
import {
    fitToColumn,
    IImportWrapperProps,
    IMPORT_EVENT,
    ImportEmitter,
} from '@condo/domains/common/components/Import/Index'
import { TrackingEventType, useTracking } from '@condo/domains/common/components/TrackingContext'
import { MetersDataImporter } from '@condo/domains/meter/components/MetersDataImporter'
import { TOnMetersUpload } from '@condo/domains/meter/components/MetersDataImporterTypes'
import { useMetersImporter } from '@condo/domains/meter/hooks/useMetersImporter'
import { ProcessedRow } from '@condo/domains/meter/utils/metersImporters/AbstractMetersImporter'

export type IMetersImportWrapperProps = Pick<IImportWrapperProps, 'accessCheck' | 'onFinish' | 'uploadButtonLabel' | 'importCardButton'>

const MetersImportWrapper: React.FC<IMetersImportWrapperProps> = (props) => {
    const {
        accessCheck,
        onFinish: handleFinish,
        uploadButtonLabel,
        importCardButton,
    } = props

    const intl = useIntl()
    const domain = 'meter'

    const ChooseFileForUploadLabel = intl.formatMessage({ id: 'import.uploadModal.chooseFileForUpload' })
    const ErrorsMessage = intl.formatMessage({ id: 'import.Errors' })

    const { logEvent, getEventName } = useTracking()

    const [activeModal, setActiveModal] = useState<ActiveModalType>(null)

    useEffect(() => {
        if (typeof activeModal !== 'undefined') {
            ImportEmitter.emit(IMPORT_EVENT, { domain, status: activeModal })
        }
    }, [activeModal])

    const totalRowsRef = useRef(0)
    const setTotalRowsRef = (value: number) => {
        totalRowsRef.current = value
    }
    const dataTypeRef = useRef(null)

    const successRowsRef = useRef(0)
    const setSuccessRowsRef = () => {
        successRowsRef.current ++
    }

    const errors = useRef([])
    const clearErrors = () => {
        errors.current.splice(0, errors.current.length)
    }
    const handleRowError = (row: ProcessedRow) => {
        errors.current.push(row)
    }

    const [importData, progress, error, isImported, breakImport, columnsHeadersResolver] = useMetersImporter({
        setTotalRows: setTotalRowsRef,
        setSuccessRows: setSuccessRowsRef,
        handleRowError,
        onFinish: () => {
            setActiveModal(errors.current.length > 0 ? 'partlyLoaded' : 'success')

            const eventName = getEventName(TrackingEventType.ImportComplete)
            logEvent({ eventName })
            if (isFunction(handleFinish)) {
                handleFinish()
            }
        },
        onError: () => {
            setActiveModal('error')
        },
    })

    const handleUpload = useCallback<TOnMetersUpload>((dataType, colsData) => {
        setActiveModal('progress')

        totalRowsRef.current = 0
        successRowsRef.current = 0
        dataTypeRef.current = dataType
        if (errors.current.length > 0) clearErrors()
        importData(dataType, colsData)
    }, [importData])

    const handleDownloadPartyLoadedData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const erroredRows = errors.current
                const columnsHeaders = columnsHeadersResolver(dataTypeRef.current)
                const data = []
                if (columnsHeaders) {
                    data.push(columnsHeaders.map(column => column.name).concat([ErrorsMessage]))
                }

                for (let i = 0; i < erroredRows.length; i++) {
                    const line = erroredRows[i].originalRow.map((cell) => {
                        if (!cell) return null
                        return String(cell)
                    })
                    line.push(erroredRows[i].errors ? erroredRows[i].errors.join(', \n') : null)
                    data.push(line)
                }

                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.aoa_to_sheet(data)
                ws['!cols'] = fitToColumn(data)
                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, `${domain}_failed_data.xlsx`)
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [ErrorsMessage, columnsHeadersResolver])

    const closeModal = useCallback(() => setActiveModal(null), [])

    const handleBreakImport = useCallback(() => {
        closeModal()
        breakImport()
        if (isFunction(handleFinish)) {
            handleFinish()
        }
    }, [breakImport, closeModal, handleFinish])

    const metersDataImporter = useMemo(() => {
        return (
            <MetersDataImporter onUpload={handleUpload}>
                <Button type='primary'>
                    {ChooseFileForUploadLabel}
                </Button>
            </MetersDataImporter>
        )
    }, [ChooseFileForUploadLabel, handleUpload])

    return (
        accessCheck && (
            <BaseImportWrapper
                {...{
                    importCardButton,
                    setActiveModal,
                    domainName: domain,
                    uploadButtonLabel,
                    closeModal,
                    activeModal,
                    handleBreakImport,
                    progress,
                    handleDownloadPartyLoadedData,
                    successRowsRef,
                    totalRowsRef,
                    error,
                    dataImporter: metersDataImporter,
                }}
            />
        )
    )
}

export {
    MetersImportWrapper,
}
