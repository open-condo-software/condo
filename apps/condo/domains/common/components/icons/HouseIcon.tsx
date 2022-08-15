import Icon  from '@ant-design/icons'
import { CustomIconComponentProps }  from '@ant-design/icons/lib/components/Icon'
import React from 'react'

const HouseIconSvg: React.FC<CustomIconComponentProps> = (props) => {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' {...props}>
            <path d='M22.1828 11.8363l-9.6539-9.6469a.7484.7484 0 00-1.0594 0l-9.6539 9.6469a1.5029 1.5029 0 00-.4406 1.0617c0 .8274.6727 1.5 1.5 1.5h1.0172v6.8836c0 .4149.3351.75.75.75h5.857v-5.25h2.625v5.25h6.2321c.4148 0 .75-.3351.75-.75V14.398h1.0171a1.493 1.493 0 001.0618-.4406c.5835-.5859.5835-1.5352-.0024-2.1211z'/>
        </svg>
    )
}

export const HouseIcon: React.FC = (props) => {
    return (
        <Icon component={HouseIconSvg} {...props} width='26' height='26' viewBox='0 0 24 24'/>
    )
}
