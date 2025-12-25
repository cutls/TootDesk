export { }
declare global {
    type StreamingArray = [string, WebSocketInterface, string]
	var streamings: StreamingArray[]
	var userStreamings: StreamingArray[]
}
