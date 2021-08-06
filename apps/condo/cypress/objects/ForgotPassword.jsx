/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
import { HOME_PAGE_URL } from './HomePage'

const FORGOT_PASSWORD_URL = `${HOME_PAGE_URL}/auth/forgot`

/*
forgot-email-item
forgot-button
forgot-success-message
*/

class ForgotPassword {

    visit () {
        cy.visit(FORGOT_PASSWORD_URL)
    }

    fillEmail (value) {
        const field = cy.get('[data-ci=forgot-email-item] input')
        field.clear()
        field.type(value)
        return this
    }

    startPasswordRecovery () {
        const button = cy.get('[data-ci=forgot-button]')
        button.click()
    }

}

export {
    ForgotPassword,
    FORGOT_PASSWORD_URL,
}
