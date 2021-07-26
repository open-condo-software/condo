import React from 'react'
import { Alert, Progress } from 'antd'
import get from 'lodash/get'
import { ErrorInfo } from '../../utils/importer'

export const ModalContext = React.createContext({ progress: 0, error: null, isImported: false })

export const getUploadSuccessModalConfig = (title: string, content: string, okText: string) => {
    return {
        title,
        closable: true,
        content: (
            <Alert
                style={{ marginTop: 16 }}
                message={content}
                type='success'
            />
        ),
        okText,
    }
}

export const getUploadErrorModalConfig = (title: string, defaultErrorText: string, okText: string) => {
    return {
        title,
        closable: true,
        content: (
            <ModalContext.Consumer>
                {
                    ({ error }) => {
                        const errorMessage = get(error, 'message') || defaultErrorText

                        return (
                            <Alert
                                style={{ marginTop: 16 }}
                                message={errorMessage}
                                type='error'
                            />
                        )
                    }
                }
            </ModalContext.Consumer>
        ),
        okText,
    }
}

export const getUploadProgressModalConfig = (title: string, processingMessage: string, okText: string,
    onButtonClick: () => void) => {
    return {
        title: title,
        closable: false,
        content: (
            <ModalContext.Consumer>
                {
                    ({ progress }) => {
                        return (
                            <>
                                <Progress
                                    format={(percent) => Math.floor(percent) + '%'}
                                    percent={progress}
                                    status={'active'}
                                />
                                <Alert
                                    style={{ marginTop: 16 }}
                                    message={processingMessage}
                                    type='info'
                                />
                            </>
                        )
                    }
                }
            </ModalContext.Consumer>
        ),
        okText: okText,
        okButtonProps: {
            type: 'primary',
            danger: true,
        },
        onOk: onButtonClick,
    }
}

export const getPartlyLoadedModalConfig = (title: string, content: string, okText: string, cancelText: string, errors: Array<ErrorInfo>) => {
    return {
        title: title,
        closable: false,
        content: (
            <Alert
                style={{ marginTop: 16 }}
                message={content}
                type='warning'
            />
        ),
        okText: okText,
        onOk: () => {
            console.log(errors)
        },
        cancelText: cancelText,
    }
}
