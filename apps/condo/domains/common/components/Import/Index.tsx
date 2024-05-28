import dayjs from 'dayjs'
import { EventEmitter } from 'eventemitter3'
import isDate from 'lodash/isDate'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import XLSX from 'xlsx'

import { useIntl } from '@open-condo/next/intl'
import { Button, CardBodyProps, CardHeaderProps } from '@open-condo/ui'

import { DataImporter } from '@condo/domains/common/components/DataImporter'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { useImporter } from '@condo/domains/common/hooks/useImporter'
import {
    Columns,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    ProcessedRow,
    MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'

import { ActiveModalType, BaseImportWrapper } from './BaseImportWrapper'


export interface IImportWrapperProps {
    accessCheck: boolean
    onFinish: (variables: unknown) => void
    columns: Columns
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
    mutationErrorsToMessages?: MutationErrorsToMessagesType
    uploadButtonLabel?: string
    domainName: string
    importCardButton?: {
        header: Pick<CardHeaderProps, 'emoji' | 'headingTitle'>,
        body: Pick<CardBodyProps, 'description'>
    }
}

export function fitToColumn (arrayOfArray) {
    return arrayOfArray[0].map((_, index) => (
        { wch: Math.max(...arrayOfArray.map(row => row[index] ? row[index].toString().length : 0)) }
    ))
}

const eventEmitter = new EventEmitter()
export const IMPORT_EVENT = 'ImportEvent'
export const ImportEmitter = {
    addListener: (event, fn) => eventEmitter.addListener(event, fn),
    removeListener: (event, fn) => eventEmitter.removeListener(event, fn),
    emit: (event, payload) => eventEmitter.emit(event, payload),
}

const ImportWrapper: React.FC<IImportWrapperProps> = (props) => {
    const {
        accessCheck,
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
        onFinish: handleFinish,
        mutationErrorsToMessages,
        uploadButtonLabel,
        domainName,
        importCardButton,
    } = props

    const intl = useIntl()

    const ChooseFileForUploadLabel = intl.formatMessage({ id: 'import.uploadModal.chooseFileForUpload' })
    const ErrorsMessage = intl.formatMessage({ id: 'import.Errors' })

    const { logEvent, getEventName } = useTracking()

    const [activeModal, setActiveModal] = useState<ActiveModalType>()

    useEffect(() => {
        if (typeof activeModal !== 'undefined') {
            ImportEmitter.emit(IMPORT_EVENT, { domain: domainName, status: activeModal })
        }
    }, [activeModal, domainName])

    const totalRowsRef = useRef(0)
    const setTotalRowsRef = (value: number) => {
        totalRowsRef.current = value
    }

    const successRowsRef = useRef(0)
    const setSuccessRowsRef = () => {
        successRowsRef.current = successRowsRef.current + 1
    }

    const errors = useRef([])
    const clearErrors = () => {
        errors.current.splice(0, errors.current.length)
    }
    const handleRowError = (row: ProcessedRow) => {
        errors.current.push(row)
    }

    const [importData, progress, error, isImported, breakImport] = useImporter({
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
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
        mutationErrorsToMessages,
    })

    const handleUpload = useCallback((file) => {
        setActiveModal('progress')

        totalRowsRef.current = 0
        successRowsRef.current = 0
        if (errors.current.length > 0) clearErrors()
        importData(file.data)
    }, [importData])

    const handleDownloadPartyLoadedData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const erroredRows = errors.current
                const data = [columns.map(column => column.name).concat([ErrorsMessage])]

                for (let i = 0; i < erroredRows.length; i++) {
                    const line = erroredRows[i].originalRow.map(cell => {
                        if (!cell.value) return null
                        if (isDate(cell.value)) {
                            return dayjs(cell.value).format('DD.MM.YYYY')
                        }
                        return String(cell.value)
                    })
                    line.push(erroredRows[i].errors ? erroredRows[i].errors.join(', \n') : null)
                    data.push(line)
                }

                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.aoa_to_sheet(data)
                ws['!cols'] = fitToColumn(data)
                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, `${domainName}_failed_data.xlsx`)
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [ErrorsMessage, columns, domainName])

    const closeModal = useCallback(() => setActiveModal(null), [])

    const handleBreakImport = useCallback(() => {
        closeModal()
        breakImport()
        if (isFunction(handleFinish)) {
            handleFinish()
        }
    }, [breakImport, closeModal, handleFinish])

    const dataImporter = useMemo<JSX.Element>(() => {
        return (
            <DataImporter onUpload={handleUpload}>
                <Button type='primary'>
                    {ChooseFileForUploadLabel}
                </Button>
            </DataImporter>
        )
    }, [ChooseFileForUploadLabel, handleUpload])

    return (
        accessCheck && (
            <BaseImportWrapper
                {...{
                    importCardButton,
                    setActiveModal,
                    domainName,
                    uploadButtonLabel,
                    closeModal,
                    activeModal,
                    handleBreakImport,
                    progress,
                    handleDownloadPartyLoadedData,
                    successRowsRef,
                    totalRowsRef,
                    error,
                    dataImporter,
                }}
            />
        )
    )
}

export {
    ImportWrapper,
}
