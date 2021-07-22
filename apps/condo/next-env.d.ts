/// <reference types="next" />
/// <reference types="next/types/global" />

import React from 'react'

interface IPageInterface extends React.FC{
    headerAction?: React.ReactElement
    container?: React.FC
}