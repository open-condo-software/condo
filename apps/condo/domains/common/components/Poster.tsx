import styled from '@emotion/styled'

interface IImageProps {
    src: string
}

export const Poster = styled.div<IImageProps>`
  background: url(${({ src }) => src}) no-repeat center center;
  background-size: cover;
  width: 100%;
  height: 100%;
`
