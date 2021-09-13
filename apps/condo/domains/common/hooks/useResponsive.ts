import { Grid } from 'antd'

const { useBreakpoint } = Grid

export const useResponsive = () => {
    const breakpoints = useBreakpoint()

    const isResponsive = (breakpoints.md || breakpoints.xs || breakpoints.sm) && !breakpoints.lg

    return { breakpoints, isResponsive }
}
