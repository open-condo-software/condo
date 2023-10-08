import Icon from '@ant-design/icons'
import React from 'react'

const BulbIconSVG = ({ width = 20, height = 20 }) => (
    <svg width={width} height={height} viewBox='0 0 24 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M4.156 14.846A7.689 7.689 0 018 .5a7.689 7.689 0 013.844 14.346v2.716a.75.75 0 01-.75.75H4.906a.75.75 0 01-.75-.75v-2.716zm1.032 4.966h5.625c.103 0 .187.085.187.188v.75a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V20c0-.103.084-.188.188-.188z' fill='currentColor'/>
    </svg>
)

export const BulbIcon: React.FC = (props) => {
    return (
        <Icon component={BulbIconSVG} {...props}/>
    )
}