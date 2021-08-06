/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
import { HOME_PAGE_URL } from './Home'
import { resetToken } from '../fixtures/user.json'

const CHANGE_PASSWORD_URL = `${HOME_PAGE_URL}/auth/change-password?token=${resetToken}`

/*
changepassword-password-item
changepassword-confirm-item
changepassword-button
*/

class ChangePassword {

    visit () {
        cy.visit(CHANGE_PASSWORD_URL)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-ci=changepassword-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillConfirmPassword (value) {
        const field = cy.get('[data-ci=changepassword-confirm-item] input')
        field.clear()
        field.type(value)
        return this
    }

    changePasswordClick () {
        const button = cy.get('[data-ci=changepassword-button]')
        button.click()
        return this
    }
}

export {
    ChangePassword,
    CHANGE_PASSWORD_URL,
}
