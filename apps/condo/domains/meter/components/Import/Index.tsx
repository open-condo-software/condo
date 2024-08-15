import { File } from '@app/condo/schema'
import { isNil, isFunction } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import { ActiveModalType, BaseImportWrapper } from '@condo/domains/common/components/Import/BaseImportWrapper'
import {
    IImportWrapperProps,
    IMPORT_EVENT,
    ImportEmitter,
} from '@condo/domains/common/components/Import/Index'
import { MetersDataImporter } from '@condo/domains/meter/components/MetersDataImporter'
import { TOnMetersUpload } from '@condo/domains/meter/components/MetersDataImporterTypes'
import { useMeterReadingsImportTask } from '@condo/domains/meter/hooks/useMeterReadingsImportTaskUIInterface'

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
    const { organization } = useOrganization()
    const { user } = useAuth() as { user: { id: string } }

    const ChooseFileForUploadLabel = intl.formatMessage({ id: 'import.uploadModal.chooseFileForUpload' })
    const ErrorsMessage = intl.formatMessage({ id: 'import.Errors' })

    const [activeModal, setActiveModal] = useState<ActiveModalType>()

    useEffect(() => {
        if (typeof activeModal !== 'undefined') {
            ImportEmitter.emit(IMPORT_EVENT, { domain, status: activeModal })
        }
    }, [activeModal])

    const totalRowsRef = useRef(0)
    const successRowsRef = useRef(0)
    const [fileRef, setFileRef] = useState<File>()

    const closeModal = () => setActiveModal(null)
    const closeForRunningModal = useCallback(() =>  {
        closeModal()
        if (isFunction(handleFinish)) {
            handleFinish()
        }
    }, [handleFinish])

    const handleUpload = useCallback<TOnMetersUpload>((blob: File) => {
        setFileRef(blob)
    }, [setFileRef])

    const { handleRunTask } = useMeterReadingsImportTask({
        file: fileRef,
        userId: user.id,
        organizationId: organization.id,
    })

    useEffect(() => {
        if (!isNil(fileRef) && isFunction(handleRunTask)) {
            handleRunTask()
            closeForRunningModal()
        }
    }, [fileRef])

    const handleDownloadPartyLoadedData = useCallback(() => {
        return new Promise<void>((resolve) => resolve())
    }, [ErrorsMessage])

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
                    handleBreakImport: closeForRunningModal,
                    progress: 0,
                    handleDownloadPartyLoadedData,
                    successRowsRef,
                    totalRowsRef,
                    error: null,
                    dataImporter: metersDataImporter,
                }}
            />
        )
    )
}

export {
    MetersImportWrapper,
}
