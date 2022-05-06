import get from 'lodash/get'
import React, { useState, useEffect, useReducer, useMemo, useRef, useCallback } from 'react'
import { Upload } from 'antd'
import isEmpty from 'lodash/isEmpty'
import { DeleteFilled, EditFilled } from '@ant-design/icons'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'

import { useIntl } from '@core/next/intl'
import { File } from '@app/condo/schema'

import { Button } from '@condo/domains/common/components/Button'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

type DBFile = {
    id: string
    file: File
}
type UploadListFile = UploadFile & {
    id: string
}

export type Module = {
    useCreate: (attrs, onComplete) => (attrs) => Promise<DBFile>
    useUpdate: (attrs, onComplete) => (update, attrs) => Promise<DBFile>
    useSoftDelete: (attrs, onComplete) => (state, attrs) => Promise<unknown>
}

const reducer = (state, action) => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete': {
            if (file.id) {
                return {
                    ...state,
                    added: [...state.added].filter(addFile => addFile.id !== file.id),
                    deleted: [...state.deleted, file],
                }
            } else if (file.response.id) {
                const fileToDeleteId = get(file, ['response', 'id'])
                const fileToDelete = [...state.added].find(addedFile => addedFile.id === fileToDeleteId)

                return {
                    ...state,
                    added: [...state.added].filter(addFile => addFile.id !== fileToDeleteId),
                    deleted: [...state.deleted, fileToDelete],
                }
            }

            return state
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
    const uploadFiles = files.map(({ id, file }) => {
        const fileInList = {
            uid: file.id,
            id,
            name: file.originalFilename,
            status: 'done' as UploadFileStatus,
            url: file.publicUrl,
        }
        return fileInList
    })
    return uploadFiles
}

interface IUploadComponentProps {
    initialFileList: DBFile[]
    UploadButton?: React.ReactElement
}
interface IMultipleFileUploadHookArgs {
    Model: Module
    relationField: string
    initialFileList: DBFile[]
    initialCreateValues?: Record<string, unknown>,
    dependenciesForRerenderUploadComponent?: Array<unknown>
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
}: IMultipleFileUploadHookArgs): IMultipleFileUploadHookResult => {
    const [modifiedFiles, dispatch] = useReducer(reducer, { added: [], deleted: [] })
    const [filesCount, setFilesCount] = useState(initialFileList.length)
    // Todo(zuch): without ref modifiedFiles dissappears on submit
    const modifiedFilesRef = useRef(modifiedFiles)
    useEffect(() => {
        modifiedFilesRef.current = modifiedFiles
    }, [modifiedFiles])

    const updateAction = Model.useUpdate({}, () => Promise.resolve())
    const deleteAction = Model.useSoftDelete({}, () => Promise.resolve())

    const syncModifiedFiles = useCallback(async (id: string) => {
        const { added, deleted } = modifiedFilesRef.current
        for (const file of added) {
            await updateAction({ [relationField]: id }, file)
        }
        for (const file of deleted) {
            await deleteAction({}, { id: file.id })
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
        UploadButton,
    } = props

    const [listFiles, setListFiles] = useState<UploadListFile[]>([])

    useEffect(() => {
        const convertedFiles = convertFilesToUploadFormat(fileList)
        setListFiles(convertedFiles)
    }, [fileList])

    useEffect(() => {
        setFilesCount(listFiles.length)
    }, [listFiles.length, setFilesCount])

    const createAction = Model.useCreate(initialCreateValues, (file: DBFile) => Promise.resolve(file))

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
            setListFiles(fileList)
        },
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => {
                const removeIcon = (
                    <DeleteFilled onClick={() => {
                        const { id, uid } = file
                        if (!id) {
                            // remove file that failed to upload from list
                            setListFiles([...listFiles].filter(file => file.uid !== uid))
                            onFilesChange({ type: 'delete', payload: file })
                            return
                        }
                        setListFiles([...listFiles].filter(file => file.id !== id))
                        onFilesChange({ type: 'delete', payload: file })
                    }} />
                )
                return removeIcon
            },
        },
        customRequest: (options: UploadRequestOption) => {
            const { onSuccess, onError } = options
            const file = options.file as UploadFile
            if (file.size > MAX_UPLOAD_FILE_SIZE) {
                const error = new Error(FileTooBigErrorMessage)
                onError(error)
                return
            }
            return createAction({ ...initialCreateValues, file }).then( dbFile  => {
                const [uploadFile] = convertFilesToUploadFormat([dbFile])
                onSuccess(uploadFile, null)
                onFilesChange({ type: 'add', payload: dbFile })
            }).catch(err => {
                const error = new Error(UploadFailedErrorMessage)
                console.error('Upload failed', err)
                onError(error)
            })
        },
    }

    return (
        <div className={'upload-control-wrapper'}>
            <Upload { ...options } >
                {
                    UploadButton ? UploadButton : (
                        <Button
                            type={'sberDefaultGradient'}
                            secondary
                            icon={<EditFilled />}
                        >
                            {AddFileLabel}
                        </Button>
                    )
                }
            </Upload>
        </div>
    )
}
