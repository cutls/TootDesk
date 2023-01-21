export interface IConfig {
    tlPerScreen: number
    useAbsoluteTime: boolean
    useRelativeTime: boolean
    imageHeight: number
}
export const configInit: IConfig = {
    tlPerScreen: 1,
    useAbsoluteTime: false,
    useRelativeTime: true,
    imageHeight: 100
}