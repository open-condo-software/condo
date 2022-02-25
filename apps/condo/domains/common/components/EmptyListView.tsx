import { Empty, Space } from 'antd'
import { useRouter } from 'next/router'
import { Button } from './Button'
import { EmptyIcon } from './EmptyIcon'
import React from 'react'
import styled from '@emotion/styled'

export interface IEmptyListProps {
    label: string,
    message: string,
    createRoute: string,
    createLabel: string,
}

export interface IBasicEmptyListProps {
    image?: string
    children?: React.ReactNode
}

export const BasicEmptyListView: React.FC<IBasicEmptyListProps> = ({ image, children }) => {
    const style = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
    }
    return (
        <div style={style}>
            <Empty
                style={{ maxWidth: '400px' }}
                image={image ? image : <EmptyIcon/>}
                imageStyle={{ height: '120px' }}
                description={
                    <Space direction={'vertical'} size={0}>
                        {children}
                    </Space>
                }
            />
        </div>
    )
}

const EmptyListLabel = styled.div`
  font-weight: 700;
  font-size: 20px;
  line-height: 28px;
  text-align: center;
  letter-spacing: -0.01em;
`

const EmptyListMessage = styled.div`
  font-size: 16px;
  line-height: 24px;
  color: #82879F;
  text-align: center;
  letter-spacing: -0.01em;
  margin: 8px 0 24px 0;
`

export const EmptyListView: React.FC<IEmptyListProps> = ({ label, message, createRoute, createLabel }) => {
    const router = useRouter()
    return (
        <BasicEmptyListView image="dino/dino-searching.png">
            <EmptyListLabel>{label}</EmptyListLabel>
            <EmptyListMessage>{message}</EmptyListMessage>
            <Button
                type="sberBlack"
                style={{ marginTop: '16px' }}
                onClick={() => router.push(createRoute)}
            >
                {createLabel}
            </Button>
        </BasicEmptyListView>
    )
}

export default EmptyListView
