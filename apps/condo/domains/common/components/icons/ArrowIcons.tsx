const ArrowIconUp = ({ width = 20, height = 20 }) => (
    <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="10" fill="#D9F7BE"/>
        <path d="M6.73804 6.59496L6.73804 7.68391L11.0938 7.68391L6.20771 12.57L6.98553 13.3478L11.8716 8.46173L11.8716 12.8175L12.9606 12.8175L12.9606 6.59497L6.73804 6.59496Z" fill="#4CD174" stroke="#4CD174" strokeWidth="0.5"/>
    </svg>
)

const ArrowIconDown = ({ width = 20, height = 20 }) => (
    <svg width={width} height={height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="10" fill="#FFCCC7"/>
        <path d="M12.9607 6.73707L11.8718 6.73707L11.8718 11.0928L6.98565 6.20674L6.20783 6.98455L11.0939 11.8707L6.73816 11.8707L6.73816 12.9596L12.9607 12.9596L12.9607 6.73707Z" fill="#222" stroke="#222" strokeWidth="0.5"/>
    </svg>
)
const ArrowIconRight = ({ width = 7, height = 11 }) => (
    <svg width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.2426.7574 5.4853 5 1.2426 9.2426" stroke="#222" strokeWidth="2"/>
    </svg>
)
const ArrowIconLeft = ({ width = 7, height = 11 }) => (
    <svg width={width} height={height} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.7574 9.2426 1.5147 5 5.7574.7574" stroke="#222" strokeWidth="2"/>
    </svg>
)

export { ArrowIconUp, ArrowIconDown, ArrowIconLeft, ArrowIconRight }
