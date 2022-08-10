import { ThemeColors, ThemeGradients } from './types'

export const colors: ThemeColors = {
    brand: {
        main: '#39CE66',
    },
    gray: {
        black100: '#222',
        gray75: '#82879F',
        gray50: '#D0D3E5',
        gray30: '#E6E8F1',
        gray15: '#F2F3F7',
        totalWhite: '#FFF',
    },
    ticketStatus: {
        newOrReopened: '#EB3468',
        inProgress: '#F08633',
        canceled: '#B4710D',
        delayed: '#3786C7',
        done: '#33CE66',
        closed: '#159A41',
    },
    ticketType: {
        accident: {
            color: '#D01B1B',
            background: '#FFE0E9',
        },
        paid: {
            color: '#1C7E79',
            background: '#B5F0ED',
        },
        returned: {
            color: '#CE6212',
            background: '#FFDCC2',
        },
        warranty: {
            color: '#5E22C6',
            background: '#E5D3FF',
        },
        other: {
            color: '#FFF',
            background: '#82879F',
        },
    },
    errors: {
        info: {
            color: '#2696F3',
            background: '#E7F4FF',
        },
        error: {
            color: '#FF3B30',
            background: '#FFECEB',
        },
        warning: {
            color: '#FF9500',
            background: '#FFF5E6',
        },
        success: {
            color: '#34C759',
            background: '#EBFAEF',
        },
    },
}

export const gradients: ThemeGradients = {
    brand: {
        main: 'linear-gradient(117.93deg, #4CD174 17.32%, #6DB8F2 82.68%)',
        mainHovered: 'linear-gradient(117.93deg, #3DCB68 17.32%, #58A6E2 82.68%)',
        mainPressed: 'linear-gradient(117.93deg, #2ABB56 17.32%, #3996DD 82.68%)',
    },
}