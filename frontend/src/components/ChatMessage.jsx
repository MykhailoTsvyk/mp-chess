
export default function ChatMessage({message}) {
    const timestampObj = message?.timestamp ? new Date(message.timestamp) : new Date()
    const localTimestamp = timestampObj.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})

    return (
        <div className="bg-ui-contrast px-2 py-1 border rounded border-ui-border">
            <div className="flex justify-between">
                <h1 className="font-bold cursor-pointer hover:underline inline flex-wrap">{message.author.username} <span className="text-sm text-ui-secondary font-normal">{message.role}</span></h1>
                <p className="text-sm text-ui-secondary">{localTimestamp}</p>
            </div>

            <p className="mt-1 flex-wrap text-sm">
                {message.text}
            </p>
        </div>
    )
}