import {
    Carousel as DefaultCarousel,
    CarouselProps as DefaultCarouselProps,
} from 'antd'
import { CarouselRef } from 'antd/lib/carousel'
import React from 'react'

import { ArrowControl } from '../_utils/controls'

const CAROUSEL_CLASS_PREFIX = 'condo-carousel'
const DEFAULT_AUTOPLAY_SPEED = 5000 // 5 sec

export type CarouselProps = Pick<DefaultCarouselProps,
'slidesToShow'
| 'autoplay'
| 'autoplaySpeed'
| 'draggable'
| 'infinite'
| 'speed'
| 'beforeChange'
| 'children'
| 'effect'
> & {
    dots?: boolean
    controlsSize?: 'large' | 'small'
}

const Carousel = React.forwardRef<CarouselRef, CarouselProps>((props, ref) => {
    const {
        children,
        autoplaySpeed = DEFAULT_AUTOPLAY_SPEED,
        controlsSize = 'large',
        ...rest
    } = props

    return (
        <DefaultCarousel
            {...rest}
            arrows={true}
            nextArrow={<ArrowControl size={controlsSize} type='next'/>}
            prevArrow={<ArrowControl size={controlsSize} type='prev'/>}
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

export type {
    CarouselRef,
}