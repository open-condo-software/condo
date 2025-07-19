import Icon from '@ant-design/icons'
import React from 'react'

const TotalBalanceIconSvg = ({ width = 40, height = 30 }) => (
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='30' fill='none'><rect width='38' height='28' x='1' y='1' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><rect width='34' height='28' x='1' y='1' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><path fill='#fff' stroke='#000' strokeWidth='2' d='M25 15a7 7 0 0 1 7-7h7v14h-7a7 7 0 0 1-7-7Z'/><rect width='4' height='4' x='30' y='13' fill='#fff' stroke='#000' strokeWidth='2' rx='2'/></svg>
)

const BalanceOutIconSvg = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'><rect width='38' height='28' x='1' y='11' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><rect width='34' height='28' x='1' y='11' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><path fill='#FF3B30' stroke='#000' strokeWidth='2' d='M14.87 18a4 4 0 0 1-3.58-5.77l3.28-6.67a4 4 0 0 1 7.18 0l3.28 6.67a4 4 0 0 1-3.6 5.77H14.88Z'/><path fill='#fff' stroke='#000' strokeWidth='2' d='M25 25a7 7 0 0 1 7-7h7v14h-7a7 7 0 0 1-7-7Z'/><rect width='4' height='4' x='30' y='23' fill='#fff' stroke='#000' strokeWidth='2' rx='2'/></svg>
)

const BalanceInIconSvg = () => (
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='none'><rect width='38' height='28' x='1' y='11' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><rect width='34' height='28' x='1' y='11' fill='#fff' stroke='#000' strokeWidth='2' rx='4'/><path fill='#34C759' stroke='#000' strokeWidth='2' d='M21.44 4.31a4 4 0 0 1 3.59 5.77l-3.28 6.67a4 4 0 0 1-7.18 0l-3.28-6.67a4 4 0 0 1 3.59-5.77h6.56Z'/><path fill='#fff' stroke='#000' strokeWidth='2' d='M25 25a7 7 0 0 1 7-7h7v14h-7a7 7 0 0 1-7-7Z'/><rect width='4' height='4' x='30' y='23' fill='#fff' stroke='#000' strokeWidth='2' rx='2'/></svg>
)


export const TotalBalanceIcon: React.FC = (props) => (
    <Icon component={TotalBalanceIconSvg} {...props} />
)

export const BalanceOutIcon: React.FC = (props) => (
    <Icon component={BalanceOutIconSvg} {...props} />
)

export const BalanceInIcon: React.FC = (props) => (
    <Icon component={BalanceInIconSvg} {...props} />
)
