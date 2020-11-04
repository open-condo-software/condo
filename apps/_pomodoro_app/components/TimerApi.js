import { ENDPOINT } from '../pages/timer/[id]'

export function postTimer (intervalsJson, redirectToTimer) {
    return fetch(`${ENDPOINT}/get-timer/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intervalsJson),
    }).then((data) => data.json().then((j) => redirectToTimer(j.id)))
}
