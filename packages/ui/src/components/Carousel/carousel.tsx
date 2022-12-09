import React from 'react'
import {
    Carousel as DefaultCarousel,
    CarouselProps as DefaultCarouselProps,
} from 'antd'
import { CarouselRef } from 'antd/lib/carousel'
import { CarouselArrow } from './arrow'

const CAROUSEL_CLASS_PREFIX = 'condo-carousel'
const DEFAULT_AUTOPLAY_SPEED = 5000 // 5 sec
const DEFAULT_ARROW_PROPS = {
    arrows: true,
    nextArrow: <CarouselArrow/>,
    prevArrow: <CarouselArrow/>,
}

export type CarouselProps = Pick<DefaultCarouselProps,
'slidesToShow'
| 'autoplay'
| 'autoplaySpeed'
| 'draggable'
| 'infinite'
| 'speed'
| 'beforeChange'
| 'children'
> & {
    dots?: boolean
}

const Carousel = React.forwardRef<CarouselRef, CarouselProps>((props, ref) => {
    const {
        children,
        autoplaySpeed = DEFAULT_AUTOPLAY_SPEED,
        ...rest
    } = props

    return (
        <DefaultCarousel
            {...rest}
            {...DEFAULT_ARROW_PROPS}
            autoplaySpeed={autoplaySpeed}
            prefixCls={CAROUSEL_CLASS_PREFIX}
            ref={ref}
        >
            {React.Children.map(children, (child, index) => {
                return (
                    <section key={index}>
                        {child}
                    </section>
                )
            })}
        </DefaultCarousel>
    )
})

Carousel.displayName = 'Carousel'

export {
    Carousel,
}