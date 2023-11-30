import { DeleteFilled, EditFilled } from '@ant-design/icons'
import { File } from '@app/condo/schema'
import { Upload, UploadProps } from 'antd'
import { ShowUploadListInterface } from 'antd/es/upload/interface'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

import { TrackingEventType, useTracking } from './TrackingContext'

export type DBFile = {
    id: string
    file?: File
}
export type UploadListFile = UploadFile & {
    id: string
}

export type Module = {
    useCreate: (attrs, onComplete?) => (attrs) => Promise<DBFile>
    useUpdate: (attrs, onComplete?) => (update, attrs) => Promise<DBFile>
    useSoftDelete: (onComplete?) => (attrs) => Promise<unknown>
}

const reducer = (state, action) => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete': {
            if (file.id) {
                return {
                    ...state,
                    added: state.added.filter(addFile => addFile.id !== file.id),
                    deleted: [...state.deleted, file],
                }
            }

            const fileToDeleteId = get(file, ['response', 'id'])

            if (!fileToDeleteId) return state

            const fileToDelete = state.added.find(addedFile => addedFile.id === fileToDeleteId)
            return {
                ...state,
                added: state.added.filter(addFile => addFile.id !== fileToDeleteId),
                deleted: [...state.deleted, fileToDelete],
            }
        }
        case 'add':
            return {
                ...state,
                added: [...state.added, file],
            }
        case 'reset':
            return {
                added: [],
                deleted: [],
            }
        default:
            throw new Error(`unknown action ${type}`)
    }
}

const convertFilesToUploadFormat = (files: DBFile[]): UploadListFile[] => {
    if (isEmpty(files)) {
        return []
    }
    return files.map(({ id, file }) => {
        return {
            uid: file.id,
            id,
            name: file.originalFilename,
            status: 'done' as UploadFileStatus,
            url: file.publicUrl,
            type: file.mimetype,
        }
    })
}

export interface IUploadComponentProps {
    initialFileList?: DBFile[]
    fileList?: DBFile[]
    UploadButton?: React.ReactElement
    uploadProps?: UploadProps
    RemoveIcon?: React.FC
    showUploadListProps?: ShowUploadListInterface
}
interface IMultipleFileUploadHookArgs {
    Model: Module
    relationField: string
    initialFileList?: DBFile[]
    initialCreateValues?: Record<string, unknown>,
    dependenciesForRerenderUploadComponent?: Array<unknown>
    onChange?
}
interface IMultipleFileUploadHookResult {
    UploadComponent: React.FC<IUploadComponentProps>,
    syncModifiedFiles: (id: string) => Promise<void>
    resetModifiedFiles: () => Promise<void>
    filesCount: number
}

export const useMultipleFileUploadHook = ({
    Model,
    relationField,
    initialFileList = [],
    initialCreateValues = {},
    // TODO(nomerdvadcatpyat): find another solution
    dependenciesForRerenderUploadComponent = [],
    onChange,
}: IMultipleFileUploadHookArgs): IMultipleFileUploadHookResult => {
    const [modifiedFiles, dispatch] = useReducer(reducer, { added: [], deleted: [] })
    const [filesCount, setFilesCount] = useState(initialFileList.length)

    // Todo(zuch): without ref modifiedFiles dissappears on submit
    const modifiedFilesRef = useRef(modifiedFiles)
    useEffect(() => {
        modifiedFilesRef.current = modifiedFiles
    }, [modifiedFiles])

    const updateAction = Model.useUpdate({})
    const deleteAction = Model.useSoftDelete()

    useEffect(() => {
        setFilesCount(initialFileList.length)
    }, [initialFileList.length])

    const syncModifiedFiles = useCallback(async (id: string) => {
        const { added, deleted } = modifiedFilesRef.current
        for (const file of added) {
            await updateAction({ [relationField]: { connect: { id } } }, file)
        }
        for (const file of deleted) {
            await deleteAction({ id: file.id })
        }
    }, [deleteAction, relationField, updateAction])

    const resetModifiedFiles = useCallback(async () => {
        dispatch({ type: 'reset' })
    }, [])

    const initialValues = useMemo(() => ({ ...initialCreateValues, [relationField]: null }), [initialCreateValues, relationField])

    const UploadComponent: React.FC<IUploadComponentProps> = useMemo(() => {
        const UploadWrapper = (props) => (
            <MultipleFileUpload
                setFilesCount={setFilesCount}
                fileList={initialFileList}
                initialCreateValues={initialValues}
                Model={Model}
                onFilesChange={dispatch}
                onChange={onChange}
                {...props}
            />
        )
        return UploadWrapper
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependenciesForRerenderUploadComponent])
    return {
        UploadComponent,
        syncModifiedFiles,
        resetModifiedFiles,
        filesCount,
    }
}

interface IMultipleFileUploadProps {
    setFilesCount: React.Dispatch<React.SetStateAction<number>>
    fileList: DBFile[]
    initialCreateValues: Record<string, unknown>
    Model: Module
    onFilesChange: React.Dispatch<{ type: string, payload: DBFile }>
    UploadButton?: React.FC
    RemoveIcon?: React.FC
    uploadProps?: UploadProps
    showUploadListProps?: ShowUploadListInterface
    onChange?
}

const MultipleFileUpload: React.FC<IMultipleFileUploadProps> = (props) => {
    const intl = useIntl()
    const AddFileLabel = intl.formatMessage({ id: 'component.uploadlist.AddFileLabel' })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' },
        { maxSizeInMb: MAX_UPLOAD_FILE_SIZE / (1024 * 1024) })
    const UploadFailedErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.UploadFailedErrorMessage' })
    const {
        setFilesCount,
        fileList,
        initialCreateValues,
        Model,
        onFilesChange,
        RemoveIcon,
        UploadButton,
        uploadProps = {},
        showUploadListProps,
        onChange,
    } = props

    const [listFiles, setListFiles] = useState<UploadListFile[]>([])
    const { getEventName, logEvent } = useTracking()

    useEffect(() => {
        const convertedFiles = convertFilesToUploadFormat(fileList)
        setListFiles(convertedFiles)
    }, [fileList])

    const createAction = Model.useCreate(initialCreateValues, (file: DBFile) => Promise.resolve(file))

    useEffect(() => {
        if (listFiles.length === 0) {
            setFilesCount(0)
        }
    }, [listFiles.length, setFilesCount])

    const RemoveButton = RemoveIcon ? RemoveIcon : DeleteFilled

    const options = {
        fileList: listFiles,
        multiple: true,
        onChange: (info) => {
            let fileList = [...info.fileList]
            fileList = fileList.map(file => {
                if (file.response) {
                    file.url = file.response.url
                }
                return file
            })

            if (isFunction(onChange)) {
                onChange(fileList)
            }

            setListFiles(fileList)
        },
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => (
                <RemoveButton onClick={() => {
                    const { id, uid } = file
                    const fileError = get(file, 'error')
                    if (!fileError) {
                        setFilesCount(filesCount => filesCount - 1)
                    }

                    if (!id) {
                        // remove file that failed to upload from list
                        setListFiles([...listFiles].filter(file => file.uid !== uid))
                        onFilesChange({ type: 'delete', payload: file })
                        return
                    }
                    setListFiles([...listFiles].filter(file => file.id !== id))
                    onFilesChange({ type: 'delete', payload: file })
                }}/>
            ),
            ...showUploadListProps,
        },
        customRequest: (options: UploadRequestOption) => {
            const { onSuccess, onError } = options
            const file = options.file as UploadFile
            if (file.size > MAX_UPLOAD_FILE_SIZE) {
                const error = new Error(FileTooBigErrorMessage)
                onError(error)
                return
            }
            return createAction({ ...initialCreateValues, file }).then(dbFile  => {
                const [uploadFile] = convertFilesToUploadFormat([dbFile])
                onSuccess(uploadFile, null)
                onFilesChange({ type: 'add', payload: dbFile })
                setFilesCount(filesCount => filesCount + 1)

                logEvent({
                    eventName: getEventName(TrackingEventType.FileUpload),
                    eventProperties: { components: { value: dbFile.id } },
                })
            }).catch(err => {
                const error = new Error(UploadFailedErrorMessage)
                console.error('Upload failed', err)
                onError(error)
            })
        },
        ...uploadProps,
    }

    const ResultUploadButton = UploadButton || (
        <Button
            type='sberDefaultGradient'
            secondary
            icon={<EditFilled />}
        >
            {AddFileLabel}
        </Button>
    )

    return (
        <div className='upload-control-wrapper'>
            <Upload { ...options }>
                {
                    !isNull(UploadButton) ? ResultUploadButton : null
                }
            </Upload>
        </div>
    )
}
