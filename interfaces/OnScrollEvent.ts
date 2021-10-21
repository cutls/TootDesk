export default interface OnScrollEvent {
    nativeEvent: {
        contentInset: { bottom: number, left: number, right: number, top: number },
        contentOffset: { x: number, y: number },
        contentSize: { height: number, width: number },
        layoutMeasurement: { height: number, width: number },
        zoomScale: number
    }
}