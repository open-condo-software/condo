import { Carousel as DefaultCarousel, CarouselProps } from 'antd'
import { CarouselRef } from 'antd/es/carousel'
import React, { forwardRef, ForwardRefExoticComponent, RefAttributes } from 'react'

import { ArrowButton } from './ArrowButton'
import { SlideContainer } from './SlideContainer'

const INITIAL_PROPS: CarouselProps = {
    dots: false,
    slidesToShow: 4,
    infinite: false,
    arrows: true,
    nextArrow: <ArrowButton type='next'/>,
    prevArrow: <ArrowButton type='prev'/>,
}

export const Carousel: ForwardRefExoticComponent<CarouselProps & RefAttributes<CarouselRef>> = forwardRef((props, ref) => {
    const { children } = props
    return (
        <DefaultCarousel {...INITIAL_PROPS} {...props} ref={ref}>
            {
                React.Children.map(children, (child, index) => {
                    return (
                        <div key={index}>
                            <SlideContainer>
                                {child}
                            </SlideContainer>
                        </div>
                    )
                })
            }
        </DefaultCarousel>
    )
})