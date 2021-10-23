export interface TL {
    max_id?: string
    since_id?: string
    min_id?: string
    limit?: string
}
export interface HTL extends TL {
    local?: boolean
}
export interface FTL extends TL {
    remote?: boolean
    only_media?: boolean
}
export interface TTL extends TL {
    local?: boolean
    only_media?: boolean
}
export interface UTL extends TL {
    pinned?: boolean
    exclude_reblogs?: boolean
    tagged?: boolean
}
export interface Media {
    file: any,
    thumbnail?: any
    description?: string
    focus?: string
}
export interface Status {
    status?: string
    media_ids?: string[]
    poll?: {
        options: string[]
        expires_in?: number
        multiple?: boolean
        hide_totals?: boolean
    }
    in_reply_to_id?: string
    sensitive?: boolean
    spoiler_text?: string
    visibility?: 'public' | 'unlisted' | 'private' | 'direct'
    scheduled_at?: string
    language?: string
}
export interface PushSubscription {
    subscription: {
        endpoint: string
        keys: {
            p256dh: string
            auth: string
        }
    }
    data?: {
        alerts?: {
            poll?: boolean
            follow?: boolean
            favourite?: boolean
            reblog?: boolean
            mention?: boolean
        }
    }
}