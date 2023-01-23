export interface IConfig {
    tlPerScreen: number
    useAbsoluteTime: boolean
    useRelativeTime: boolean
    imageHeight: number
    actionBtnSize: number
    showReactedCount: boolean
}
export const configInit: IConfig = {
    tlPerScreen: 1,
    useAbsoluteTime: false,
    useRelativeTime: true,
    imageHeight: 100,
    actionBtnSize: 27,
    showReactedCount: true
}