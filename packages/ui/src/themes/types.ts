type ColorAndBG = {
    color: string
    background: string
}

export type ThemeColors = {
    blacks: {
        black100: string
        gray75: string
        gray50: string
        gray30: string
        gray15: string
        totalWhite: string
    }
    ticketStatus: {
        newOrReopened: string
        inProgress: string
        canceled: string
        delayed: string
        done: string
        closed: string
    }
    ticketType: {
        accident: ColorAndBG
        paid: ColorAndBG
        returned: ColorAndBG
        warranty: ColorAndBG
        other: ColorAndBG
    }
    errors: {
        error: ColorAndBG,
        warning: ColorAndBG,
        success: ColorAndBG
    }
}

export type ThemeGradients = {
    main: string
    mainHovered: string
    mainPressed: string
}

export type Theme = {
    colors: ThemeColors,
    gradients: ThemeGradients,
}