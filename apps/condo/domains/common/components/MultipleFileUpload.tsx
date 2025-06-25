import { File } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Upload, UploadProps } from 'antd'
import { UploadFile, UploadFileStatus } from 'antd/lib/upload/interface'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { Paperclip, Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'
import { analytics } from '@condo/domains/common/utils/analytics'



type DBFile = {
    id: string
    file?: File
}
type UploadListFile = UploadFile & {
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

interface IUploadComponentProps {
    initialFileList: DBFile[]
    UploadButton?: React.ReactElement
    uploadProps?: UploadProps
    onFileListChange?: (fileList) => void
}

interface IMultipleFileUploadHookArgs {
    Model: Module
    relationField: string
    initialFileList?: DBFile[]
    initialCreateValues?: Record<string, unknown>
    dependenciesForRerenderUploadComponent?: Array<unknown>
}

interface IMultipleFileUploadHookResult {
    UploadComponent: React.FC<IUploadComponentProps>
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

    const initialValues = useMemo(() => ({
        ...initialCreateValues,
        [relationField]: null,
    }), [initialCreateValues, relationField])

    const UploadComponent: React.FC<IUploadComponentProps> = useMemo(() => {
        const UploadWrapper = (props) => (
            <MultipleFileUpload
                setFilesCount={setFilesCount}
                fileList={initialFileList}
                initialCreateValues={initialValues}
                Model={Model}
                updateFileList={dispatch}
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

export const StyledUpload = styled(Upload)<{ reverseFileList?: boolean }>`
  display: flex;
  flex-flow: ${props => props.reverseFileList ? 'column' : 'column-reverse'};

  .ant-upload-list-item:hover .ant-upload-list-item-info {
    background-color: inherit;
  }

  .ant-upload-list-item-info {
    & .ant-upload-text-icon {
      transform: rotate(180deg);

      span {
        color: black;
        font-size: 16px;
      }
    }
  }

  .ant-upload-list-text-container {
    & .ant-upload-list-item-name {
      font-size: 16px;
      width: auto;
      flex-grow: 0;
    }

    ${props => props.reverseFileList ? `
     &:first-child {
      margin-top: 24px;
      width: auto;
     }` : `
     &:last-child {
      margin-bottom: 24px;
      width: auto;
     }`}
  }
  
  .ant-upload-list-item-card-actions {
    display: flex;
    align-items: center;
  }
  
  .ant-upload-list-item:not(.ant-upload-list-item-error) {
    & .ant-upload-list-item-name {
      text-decoration: underline;
      color: ${colors.black};

      &:hover {
        color: ${colors.green[5]};
        text-decoration-color: ${colors.green[5]};
      }
    }
  }
  
  .ant-upload-list-item-error {
    & .ant-upload-list-item-name {
      text-decoration: none;
      color: ${colors.red[5]};
    }

    & .ant-upload-text-icon span {
      color: ${colors.red[5]};
    }
  }
`

interface IMultipleFileUploadProps {
    setFilesCount: React.Dispatch<React.SetStateAction<number>>
    fileList: DBFile[]
    initialCreateValues: Record<string, unknown>
    Model: Module
    updateFileList: React.Dispatch<{ type: string, payload: DBFile }>
    UploadButton?: React.FC
    uploadProps?: UploadProps
    onFileListChange?: (fileList) => void
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
        updateFileList,
        UploadButton,
        uploadProps = {},
        onFileListChange,
    } = props

    const [listFiles, setListFiles] = useState<UploadListFile[]>([])

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

            if (isFunction(onFileListChange)) {
                onFileListChange(fileList)
            }
        },
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => {
                const removeIcon = (
                    <Trash
                        color={colors.red[5]}
                        size='small'
                        onClick={() => {
                            const { id, uid } = file
                            const fileError = get(file, 'error')
                            if (!fileError) {
                                setFilesCount(filesCount => filesCount - 1)
                            }

                            if (!id) {
                                // remove file that failed to upload from list
                                setListFiles([...listFiles].filter(file => file.uid !== uid))
                                updateFileList({ type: 'delete', payload: file })
                                return
                            }
                            setListFiles([...listFiles].filter(file => file.id !== id))
                            updateFileList({ type: 'delete', payload: file })
                        }}
                    />
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
            return createAction({ ...initialCreateValues, file }).then(dbFile => {
                const [uploadFile] = convertFilesToUploadFormat([dbFile])
                onSuccess(uploadFile, null)
                updateFileList({ type: 'add', payload: dbFile })
                setFilesCount(filesCount => filesCount + 1)

                analytics.track('file_upload', { fileId: dbFile.id, location: window.location.href })
            }).catch(err => {
                const error = new Error(UploadFailedErrorMessage)
                console.error('Upload failed', err)
                onError(error)
            })
        },
        ...uploadProps,
    }

    return (
        <StyledUpload {...options}>
            {
                UploadButton || (
                    <Button
                        type='secondary'
                        icon={<Paperclip size='medium'/>}
                    >
                        {AddFileLabel}
                    </Button>
                )
            }
        </StyledUpload>
    )
}
