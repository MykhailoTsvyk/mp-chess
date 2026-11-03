// turns an axios error into text that can be shown to the user
export function getErrorMessage(err, fallback) {
    // no response at all: the backend is down or unreachable
    if (!err.response) {
        return "Can't reach the server. Please try again later."
    }

    const data = err.response.data

    if (typeof data === "string" && data) return data
    if (data?.message) return data.message

    // validation middleware responds with {status: "fail", errors: [{field, message}]}
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors.map(e => e.message).join(". ")
    }

    return fallback
}
