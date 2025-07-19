import Icon from '@ant-design/icons'
import React from 'react'

const UserIconSVG: React.FC = () => {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path fillRule='evenodd' clipRule='evenodd' d='M12 13C14.7614 13 17 10.7614 17 8C17 5.23858 14.7614 3 12 3C9.23857 3 6.99999 5.23858 6.99999 8C6.99999 10.7614 9.23857 13 12 13ZM12 13C18.6328 13 20.4538 18.843 20.8824 20.8401C20.9578 21.1913 20.6844 21.5 20.3253 21.5H3.67472C3.31556 21.5 3.04218 21.1913 3.11755 20.8401C3.54621 18.8431 5.36714 13 12 13Z' fill='currentColor'/>
        </svg>
    )
}

export const UserIcon: React.FC = (props) => {
    return (
        <Icon component={UserIconSVG} {...props}/>
    )
}
