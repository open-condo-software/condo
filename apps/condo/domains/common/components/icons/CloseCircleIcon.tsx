import Icon from '@ant-design/icons'
import React from 'react'

const CloseCircleSVG = () => (
    <svg width='24' height='24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M16.064 8.315a.188.188 0 0 0-.187-.188l-1.547.007L12 10.912 9.673 8.137l-1.55-.007a.187.187 0 0 0-.187.187c0 .045.017.087.045.122l3.049 3.633-3.05 3.63a.188.188 0 0 0 .143.31l1.55-.007L12 13.227l2.328 2.775 1.546.008a.187.187 0 0 0 .188-.188.195.195 0 0 0-.045-.122l-3.044-3.63 3.05-3.633a.188.188 0 0 0 .041-.122Z' fill='#EB3468'/><path d='M12 1.523c-5.798 0-10.5 4.702-10.5 10.5 0 5.799 4.702 10.5 10.5 10.5s10.5-4.701 10.5-10.5c0-5.798-4.702-10.5-10.5-10.5Zm0 19.22a8.72 8.72 0 0 1-8.719-8.72A8.72 8.72 0 0 1 12 3.305a8.72 8.72 0 0 1 8.719 8.718A8.72 8.72 0 0 1 12 20.743Z' fill='#EB3468'/></svg>
)

export const CloseCircleIcon: React.FC<React.ComponentProps<typeof Icon>> = (props) => {
    return (
        <Icon component={CloseCircleSVG} {...props} />
    )
}
