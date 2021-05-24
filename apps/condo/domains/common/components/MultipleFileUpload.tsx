import React, { useState, useEffect } from 'react'
import { Upload } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'
import { UploadOutlined, DeleteFilled } from '@ant-design/icons'
import { UploadRequestOption } from 'rc-upload/lib/interface'
import { MAX_UPLOAD_FILE_SIZE } from '@condo/domains/common/constants/uploads'
import { File } from '../../../schema'
import { UploadFile } from 'antd/lib/upload/interface'

const convertFilesToUploadFormat = (files: DBFile[]): UploadListFile[] => {
    const uploadFiles = files.map(({ id, file }) => {
        const fileInList = {
            uid: file.id,
            id,
            name: file.originalFilename,
            status: null,
            url: file.publicUrl,
        }
        fileInList.status = 'done'
        return fileInList        
    })
    return uploadFiles
}

type DBFile = {
    id: string
    file: File
}
type UploadListFile = UploadFile & {
    id: string
}

interface IMultipleFileUploadProps {
    fileList: DBFile[]
    initialCreateValues: Record<string, unknown>
    updateEditField: (files: DBFile[]) => void
    Model: {
        useCreate: (attrs, onComplete) => (attrs) => Promise<unknown>
        useSoftDelete: (attrs, onComplete) => (context, attrs) => Promise<unknown>
    }
    dispatch: React.Dispatch<unknown>,
}

const MultipleFileUpload: React.FC<IMultipleFileUploadProps> = (props) => {
    const intl = useIntl()
    const AddFileLabel = intl.formatMessage({ id: 'component.uploadlist.AddFileLabel' })
    const FileTooBigErrorMessage = intl.formatMessage({ id: 'component.uploadlist.error.FileTooBig' })

    const { 
        fileList, 
        initialCreateValues, 
        Model, 
        dispatch,
    } = props

    const [files, setFiles] = useState<UploadListFile[]>([])
    useEffect(() => {
        const convertedFiles = convertFilesToUploadFormat(fileList)
        setFiles(convertedFiles)
    }, [fileList])

    const createAction = Model.useCreate(initialCreateValues, () => Promise.resolve())

    const options = {
        fileList: files,
        showUploadList: {
            showRemoveIcon: true,
            removeIcon: (file) => {
                const removeIcon = (
                    <DeleteFilled onClick={() => {
                        const { id, uid } = file
                        if (!id) {
                            setFiles([...files].filter(file => file.uid !== uid))
                            return 
                        }
                        setFiles([...files].filter(file => file.id !== id))
                        console.log('DISPATCH DELETE')
                        dispatch({ type: 'delete', payload: file })
                        // return deleteAction({}, { id }).then((deleteResult) => {
                        //    console.log('deleteResult', deleteResult)
                        // })
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
                const info: UploadListFile = {
                    id: null,
                    uid: file.uid,
                    name: file.name,
                    status: 'error',
                    error: error,
                }
                setFiles([...files, info])
                return 
            }
            return createAction({ ...initialCreateValues, file }).catch(err => {
                onError(err)
            }).then( dbFile => {
                onSuccess('Ok', null)
                const [uploadFile] = convertFilesToUploadFormat([dbFile as DBFile])
                setFiles([...files, uploadFile])
                console.log('DISPATCH ADD')
                dispatch({ type: 'add', payload: dbFile })
                // setFilesToAdd([...filesToAdd, dbFile as DBFile])
            })
        },
    }
    return (
        <div className={'upload-control-wrapper'}>
            <Upload { ...options } >
                <Button
                    type={'sberGrey'}
                    secondary
                    icon={<UploadOutlined />}
                    size={'middle'}
                >{AddFileLabel}</Button>
            </Upload>
        </div>
    )
}

export default MultipleFileUpload
