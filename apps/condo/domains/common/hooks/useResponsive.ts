import { Grid } from 'antd'

const { useBreakpoint } = Grid

export const useResponsive = () => {
    const breakpoints = useBreakpoint()

    const isSmall = (breakpoints.md || breakpoints.xs || breakpoints.sm) && !breakpoints.lg

    return { breakpoints, isSmall }
}
