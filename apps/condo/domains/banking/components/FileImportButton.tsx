import { Upload } from 'antd'
import React from 'react'

import { Button } from '@open-condo/ui'
import type { ButtonProps } from '@open-condo/ui'

import type { UploadProps } from 'antd'

const UPLOAD_OPTIONS: UploadProps = {
    multiple: false,
    itemRender: () => null,
    accept: '.txt',
}

export type FileImportProps = {
    handleUpload: UploadProps['customRequest']
} & Pick<ButtonProps, 'loading' | 'type' | 'stateless' | 'children' | 'hidden'>

interface IFileImportButtonProps {
    (props: FileImportProps): React.ReactElement
}

const FileImportButton: IFileImportButtonProps = (props) => {
    const { children, handleUpload, ...restProps } = props

    return (
        <Upload {...UPLOAD_OPTIONS} customRequest={handleUpload} className='ant-upload-select-block'>
            <Button stateless {...restProps} block>
                {children}
            </Button>
        </Upload>
    )
}

export default FileImportButton
