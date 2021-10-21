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