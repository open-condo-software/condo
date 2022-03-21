import React from 'react'
import { TopCard } from './TopCard'
import dayjs from 'dayjs'

export const AppDescriptionPageContent: React.FC = () => {
    return (
        <>
            <TopCard
                developer={'SBERlonglonglonglonglonglonglong'}
                published={dayjs().toISOString()}
                // description={'123'}
                description={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                // title={'asd'}
                title={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci autem blanditiis consectetur ea eaque ipsum, magnam minus, modi molestias nisi nobis numquam perferendis quos recusandae ut velit voluptas voluptatem! Quos.'}
                setupUrl={'https://spotify.com'}
                partnerUrl={'https://spotify.com'}
                tag={'Биллинг'}
            />
        </>
    )
}