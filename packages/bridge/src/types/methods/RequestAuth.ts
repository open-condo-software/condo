type ClonableResponse = {
    status: number
    text: string
}

export type RequestAuthParams = {
    url: string
}

export type RequestAuthData = {
    response: ClonableResponse
}