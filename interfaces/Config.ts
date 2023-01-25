export interface IConfig {
    tlPerScreen: number
    useAbsoluteTime: boolean
    useRelativeTime: boolean
    imageHeight: number
    actionBtnSize: number
    showReactedCount: boolean
    showVia: boolean
    showGif: boolean
    autoFoldLetters: number
    autoFoldLines: number
}
export const configInit: IConfig = {
    tlPerScreen: 1,
    useAbsoluteTime: false,
    useRelativeTime: true,
    imageHeight: 100,
    actionBtnSize: 27,
    showReactedCount: true,
    showVia: false,
    showGif: true,
    autoFoldLetters: 1000,
    autoFoldLines: 20
}