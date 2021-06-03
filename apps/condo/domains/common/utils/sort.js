/*
*   Custom quick sort function. faster than native x2-3 times.
*   refs. https://jsfiddle.net/uqq54ho8/2/
* */

function quickSort (arr, leftPos, rightPos, arrLength, ascend, predicate) {
    if (!predicate) {
        predicate = (value) => value
    }
    
    const initialLeftPos = leftPos
    const initialRightPos = rightPos
    let direction = true
    let pivot = rightPos

    while ((leftPos - rightPos) < 0) {
        if (direction) {
            const sortCondition = ascend
                ? predicate(arr[pivot]) < predicate(arr[leftPos])
                : predicate(arr[pivot]) > predicate(arr[leftPos])

            if (sortCondition) {
                swap(arr, pivot, leftPos)
                pivot = leftPos
                rightPos--
                direction = !direction
            } else {
                leftPos++
            }
        } else {
            const sortCondition = ascend
                ? predicate(arr[pivot]) <= predicate(arr[rightPos])
                : predicate(arr[pivot]) >= predicate(arr[rightPos])

            if (sortCondition) {
                rightPos--
            } else {
                swap(arr, pivot, rightPos)
                leftPos++
                pivot = rightPos
                direction = !direction
            }
        }
    }

    if (pivot - 1 > initialLeftPos) {
        quickSort(arr, initialLeftPos, pivot - 1, arrLength, ascend, predicate)
    }

    if (pivot + 1 < initialRightPos) {
        quickSort(arr, pivot + 1, initialRightPos, arrLength, ascend, predicate)
    }
}

function swap (arr, el1, el2) {
    const temp = arr[el1]
    arr[el1] = arr[el2]
    arr[el2] = temp
}

module.exports = {
    quickSort,
}