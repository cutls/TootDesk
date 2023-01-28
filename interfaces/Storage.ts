import * as M from './MastodonApiReturns'
export type IVisTxt = 'public' | 'unlisted' | 'private' | 'direct'
export interface Account {
    id: string
    name: string
    acct: string
    at: string
    domain: string
    // below configs
    maxLetters?: number
    maxMedia?: number
    defaultVis?: IVisTxt
    translationEnabled?: boolean
    streaming?: string
}
export interface Emoji {
    domain: string
    emojis: M.CustomEmoji[]
    updated: number
}