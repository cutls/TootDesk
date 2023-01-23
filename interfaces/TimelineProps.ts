export default interface TimelineProps {
	type: TLType
	acct: string
	activated: boolean
	key: string
	acctName: string
	timelineData?: any
    config?: TimelineConfig
}
export interface TimelineConfig {
	speech?: boolean
	languageHide?: string[]
}
export type TLType = 'home' | 'local' | 'public' | 'list' | 'hashtag' | 'user' | 'bookmark' | 'fav' | 'notif' | 'noAuth' | 'mix'