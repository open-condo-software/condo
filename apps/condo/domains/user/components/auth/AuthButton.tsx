import { Button, ButtonProps } from '@open-condo/ui'

import './AuthButton.css'

const AuthButton: React.FC<ButtonProps> = (props) => {
    return <Button {...props} className='auth-button' />
}

export { AuthButton }
