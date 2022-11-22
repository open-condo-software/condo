export const renderPhone = (value) => {
    if (value) {
        return `${value.slice(0, 2)} ${value.slice(2, 5)} ${value.slice(5, 8)} ${value.slice(8, 10)} ${value.slice(10, 12)}`
    }
}