import React from 'react'
import Icon from '@ant-design/icons'

const BarChartIconNewSVG: React.FC = () => {
    return (
        <svg width="22" height="21" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.123 18.193H3.632a.877.877 0 0 1-.878-.877V1.877a.877.877 0 0 0-1.754 0v15.439a2.632 2.632 0 0 0 2.632 2.631h16.49a.877.877 0 0 0 0-1.754Z" fill="currentColor" stroke="#82879F"/><path d="M14.158 15.386a.877.877 0 0 0 .877-.877v-6.14a.877.877 0 1 0-1.754 0v6.14a.877.877 0 0 0 .877.877ZM7.14 15.386a.877.877 0 0 0 .878-.877v-6.14a.877.877 0 0 0-1.755 0v6.14a.877.877 0 0 0 .877.877ZM17.667 15.385a.877.877 0 0 0 .877-.877V3.982a.877.877 0 1 0-1.754 0v10.526a.877.877 0 0 0 .877.877ZM10.649 15.385a.877.877 0 0 0 .877-.877V3.982a.877.877 0 1 0-1.755 0v10.526a.877.877 0 0 0 .878.877Z" fill="currentColor" stroke="#82879F"/></svg>
    )
}

export const BarChartIconNew: React.FC = (props) => {
    return (
        <Icon component={BarChartIconNewSVG} {...props}/>
    )
}
