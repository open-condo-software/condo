import React, { useState, useEffect, useReducer, useMemo, useRef } from 'react'
import { Upload } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'
import { EditOutlined, DeleteFilled, EditFilled } from '@ant-design/icons'

import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'

import { UploadRequestOption } from 'rc-upload/lib/interface'
import { File } from '@app/condo/schema'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import { isEmpty } from 'lodash'
import { Loader } from './Loader'

type DBFile = {
    id: string
    file: File
}
type UploadListFile = UploadFile & {
    id: string
}

type Module = {
    useCreate: (attrs, onComplete) => (attrs) => Promise<DBFile>
    useUpdate: (attrs, onComplete) => (update, attrs) => Promise<DBFile>
    useSoftDelete: (attrs, onComplete) => (state, attrs) => Promise<unknown>
}

const reducer = (state, action) => {
    const { type, payload: file } = action
    switch (type) {
        case 'delete':
            return {
                ...state,
                added: [...state.added].filter(addFile => addFile.id !== file.id),
                deleted: [...state.deleted, file],
            }
        case 'add':
            return {
                ...state,
                added: [...state.added, file],
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
    UploadButton?: React.FC
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
}

export const useMultipleFileUploadHook = ({
    Model,
    relationField,
    initialFileList,
    initialCreateValues = {},
    // TODO(nomerdvadcatpyat): find another solution
    dependenciesForRerenderUploadComponent = [],
}: IMultipleFileUploadHookArgs): IMultipleFileUploadHookResult => {
    const [modifiedFiles, dispatch] = useReducer(reducer, { added: [], deleted: [] })
    // Todo(zuch): without ref modifiedFiles dissappears on submit
    const modifiedFilesRef = useRef(modifiedFiles)
    useEffect(() => {
        modifiedFilesRef.current = modifiedFiles
    }, [modifiedFiles])

    const updateAction = Model.useUpdate({}, () => Promise.resolve())
    const deleteAction = Model.useSoftDelete({}, () => Promise.resolve())

    const syncModifiedFiles = async (id: string) => {
        const { added, deleted } = modifiedFilesRef.current
        for (const file of added) {
            await updateAction({ [relationField]: id }, file)
        }
        for (const file of deleted) {
            await deleteAction({}, { id: file.id })
        }
    }

    const UploadComponent: React.FC<IUploadComponentProps> = useMemo(() => {
        const UploadWrapper = (props) => (
            <MultipleFileUpload
                fileList={initialFileList}
                initialCreateValues={{ ...initialCreateValues, [relationField]: null }}
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
    }
}

interface IMultipleFileUploadProps {
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
                    UploadButton ? (
                        <UploadButton />
                    ) : (
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
