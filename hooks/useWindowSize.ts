import { useWindowDimensions } from "react-native"

export const useWindowSize = () => {
    const { width, height } = useWindowDimensions()
    return { width: Math.min(550, width), height, deviceWidth: width }
}
