import React from 'react'

interface IPropertyMapIcon {
    height?: number
    width?: number
}

export const SectionIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg xmlns='http://www.w3.org/2000/svg' width={width} height={height} fill='none'>
        <path d='M6.8 10c-.442 0-.8.297-.8.664v3.672c0 .367.358.664.8.664.442 0 .8-.297.8-.664v-3.672c0-.367-.358-.664-.8-.664ZM15.2 10c-.442 0-.8.297-.8.664v3.672c0 .367.358.664.8.664.442 0 .8-.297.8-.664v-3.672c0-.367-.358-.664-.8-.664Z' fill='currentColor' stroke='currentColor' strokeWidth='.2'/>
        <rect x='1' y='1' width='20' height='20' rx='4' stroke='currentColor' strokeWidth='1.6'/>
        <path d='M1 5h20v1.6H1V5Z' fill='currentColor'/>
        <path fill='currentColor' d='M11.8 5v16h-1.6V5z'/>
    </svg>
)

export const FloorIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M19.335 5.21h-2.748c-.919 0-1.666.747-1.666 1.666v2.748a.443.443 0 0 1-.442.442h-2.748c-.918 0-1.665.747-1.665 1.665v2.748a.443.443 0 0 1-.442.443H6.876c-.919 0-1.666.746-1.666 1.665v2.748c0 .918.747 1.665 1.666 1.665h11.009A3.118 3.118 0 0 0 21 17.885V6.875c0-.918-.747-1.665-1.665-1.665Zm.442 12.675a1.894 1.894 0 0 1-1.892 1.892H6.875a.442.442 0 0 1-.441-.442v-2.748c0-.244.198-.443.442-.443h2.748c.918 0 1.665-.746 1.665-1.665v-2.748c0-.244.198-.442.442-.442h2.748c.919 0 1.665-.747 1.665-1.665V6.876c0-.244.199-.443.443-.443h2.748c.243 0 .442.199.442.443v11.009Z' fill='currentColor' stroke='currentColor' strokeWidth='.4'/>
        <path d='M14.106 1.18a.618.618 0 0 0-.874 0L1.672 11.69A2.277 2.277 0 0 0 1 13.31v7.072a.618.618 0 0 0 1.235 0V13.31c0-.282.11-.548.31-.747l11.56-10.509a.618.618 0 0 0 0-.873Z' fill='currentColor' stroke='currentColor' strokeWidth='.4'/>
    </svg>
)

export const ParkingIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='.8' y='.8' width='18.4' height='18.4' rx='3.2' stroke='currentColor' strokeWidth='1.6'/>
        <path d='M10.736 5C12.536 5 14 6.565 14 8.49c0 1.923-1.464 3.488-3.264 3.488h-2.39v2.303c0 .397-.301.719-.673.719-.372 0-.673-.322-.673-.72V5.72c0-.398.301-.72.673-.72h3.063Zm0 1.439h-2.39v4.1h2.39c1.057 0 1.918-.92 1.918-2.05s-.86-2.05-1.918-2.05Z' fill='currentColor' stroke='currentColor' strokeWidth='.3'/>
    </svg>
)

export const InterFloorIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='1' y='1' width='20' height='20' rx='4' stroke='currentColor' strokeWidth='1.6'/>
        <path d='M7.52 7.924a.75.75 0 0 0 .96 1.152l-.96-1.152Zm6 1.152a.75.75 0 1 0 .96-1.152l-.96 1.152Zm-3.16-2.543-.48-.576.48.576ZM8.48 9.076l2.36-1.966-.96-1.153-2.36 1.967.96 1.152Zm2.68-1.966 2.36 1.966.96-1.152-2.36-1.967-.96 1.153Zm-.32 0a.25.25 0 0 1 .32 0l.96-1.153a1.75 1.75 0 0 0-2.24 0l.96 1.153ZM14.48 14.076a.75.75 0 0 0-.96-1.152l.96 1.152Zm-6-1.152a.75.75 0 0 0-.96 1.152l.96-1.152Zm3.16 2.543.48.576-.48-.576Zm1.88-2.543-2.36 1.966.96 1.153 2.36-1.967-.96-1.152Zm-2.68 1.966-2.36-1.966-.96 1.152 2.36 1.967.96-1.153Zm.32 0a.25.25 0 0 1-.32 0l-.96 1.153a1.75 1.75 0 0 0 2.24 0l-.96-1.153Z' fill='currentColor'/>
        <path fill='currentColor' d='M10.2 7h1.6v8h-1.6z'/>
    </svg>
)

export const FlatIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='1' y='1' width='20' height='20' rx='4' stroke='currentColor' strokeWidth='1.6'/>
        <rect x='6' y='1' width='1.6' height='11' rx='.8' fill='currentColor'/>
        <path d='M12.2 7a.8.8 0 0 1 0 1.6H7.8a.8.8 0 1 1 0-1.6h4.4Z' fill='currentColor'/>
        <rect x='21' y='7' width='1.6' height='6' rx='.8' transform='rotate(90 21 7)' fill='currentColor'/>
        <path d='M6 14.8a.8.8 0 0 1 1.6 0v5.4a.8.8 0 0 1-1.6 0v-5.4Z' fill='currentColor'/>
    </svg>
)

export const ParkingFloorIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M1.874 9.574c-1.165-.784-1.165-2.578 0-3.362l6.585-4.43a4.519 4.519 0 0 1 5.082 0l6.585 4.43c1.165.784 1.165 2.578 0 3.362l-6.585 4.43a4.52 4.52 0 0 1-5.082 0l-6.585-4.43Z' stroke='currentColor' strokeWidth='1.8'/>
        <path d='m17.781 10.848 2.345 1.577c1.165.784 1.165 2.579 0 3.362l-6.585 4.43a4.519 4.519 0 0 1-5.082 0l-6.585-4.43c-1.165-.784-1.165-2.578 0-3.362l2.345-1.577' stroke='currentColor' strokeWidth='1.8'/>
    </svg>
)

export const ParkingPlaceIcon: React.FC<IPropertyMapIcon> = ({ height = 25, width = 25 }) => (
    <svg width={width} height={height} fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M1 11a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-4Z' stroke='currentColor' strokeWidth='1.6'/>
        <rect x='4' y='11' width='4' height='4' rx='2' stroke='currentColor' strokeWidth='1.5'/>
        <rect x='14' y='11' width='4' height='4' rx='2' stroke='currentColor' strokeWidth='1.5'/>
        <path d='M2 8h18l-1.586-5.55A2 2 0 0 0 16.491 1H5.51a2 2 0 0 0-1.923 1.45L2 8ZM3 19a2 2 0 1 0 4 0v-1H3v1ZM15 19a2 2 0 1 0 4 0v-1h-4v1Z' stroke='currentColor' strokeWidth='1.6'/>
    </svg>
)
