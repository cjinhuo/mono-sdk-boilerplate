const MAX_GIT_MESSAGE_LENGTH = 120
export function formatGitMessage(message: string) {
	if (message.length > MAX_GIT_MESSAGE_LENGTH) {
		return `${message.slice(0, MAX_GIT_MESSAGE_LENGTH - 4)}...`
	}
	return message
}
