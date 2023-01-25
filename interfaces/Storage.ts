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