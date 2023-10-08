type ClonableResponse = {
    status: number
    body: string
    url: string
}

export type RequestAuthParams = {
    url: string
}

export type RequestAuthData = {
    response: ClonableResponse
}