import axios from 'axios'
import * as M from '../interfaces/MastodonApiReturns'
import * as R from '../interfaces/MastodonApiRequests'
import moment from 'moment-timezone'
const getApi = async (url: string, at: string, param?: any, needHeader?: boolean) => {
    const searchParams = new URLSearchParams(param).toString()
    try {
        const api = await axios.get(`${url}?${searchParams}`, {
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'application/json'
            }
        })
        if (needHeader) {
            const link = api.headers['link']
            const min_ids = link.match(/<(.+)>/)[1].match(/max_id=([0-9]+)/)
            const min_id = min_ids ? min_ids[1] : ''
            return [api.data, min_id]
        }
        const data = api.data
        return data
    } catch (e: any) {
        const data = e.response && e.response.data
        if (data && data.error) throw `${data.error_description || ''}(${data.error}) ${e.toString()}`
        throw e as Error
    }
}
const postApi = async (url: string, at: string, param?: any, idem?: boolean) => {
    try {
        const headers: any = {
            Authorization: `Bearer ${at}`,
            'content-type': 'application/json'
        }
        if (idem) headers['Idempotency-Key'] = moment().unix()
        const api = await axios.post(`${url}`, param, {
            headers
        })
        const data = api.data
        return data
    } catch (e: any) {
        const data = e.response && e.response.data
        if (data && data.error) throw `${data.error_description || ''}(${data.error}) ${e.toString()}`
        throw e as Error
    }
}
const putApi = async (url: string, at: string, param?: any) => {
    try {
        const api = await axios.put(`${url}`, param, {
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'application/json'
            }
        })
        const data = api.data
        return data
    } catch (e: any) {
        const data = e.response && e.response.data
        if (data && data.error) throw `${data.error_description || ''}(${data.error}) ${e.toString()}`
        throw e as Error
    }
}
const deleteApi = async (url: string, at: string, param?: any) => {
    try {
        const paramStr = param && Object.entries(param).map(([key, val]: [string, any]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`).join('&');
        const api = await axios.delete(`${url}${param ? `?${paramStr}` : ''}`, {
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'application/json'
            }
        })
        const data = api.data
        return data
    } catch (e: any) {
        const data = e.response && e.response.data
        if (data && data.error) throw `${data.error_description || ''}(${data.error}) ${e.toString()}`
        throw e as Error
    }
}
const postApiMedia = async (url: string, at: string, formData: FormData) => {
    try {
        const f = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'multipart/form-data',
            },
        })
        return await f.json()
    } catch (e) {
        throw e as Error
    }
}
type TLLinking = [M.Toot[], string]
export const getV1AccountsVerifyCredentials = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/accounts/verify_credentials`, at) as M.Credential }
export const getV1TimelinesHome = async (domain: string, at: string, param?: R.HTL) => { return await getApi(`https://${domain}/api/v1/timelines/home`, at, param) as M.Toot[] }
export const getV1TimelinesLocal = async (domain: string, at: string, param?: R.FTL) => { return await getApi(`https://${domain}/api/v1/timelines/public`, at, { local: true, ...param }) as M.Toot[] }
export const getV1TimelinesPublic = async (domain: string, at: string, param?: R.FTL) => { return await getApi(`https://${domain}/api/v1/timelines/public`, at, { local: false, ...param }) as M.Toot[] }
export const getV1TimelinesHashtag = async (domain: string, at: string, tag: string, param?: R.TTL) => { return await getApi(`https://${domain}/api/v1/timelines/tag/${tag}`, at, param) as M.Toot[] }
export const getV1TimelinesList = async (domain: string, at: string, id: string, param?: R.TL) => { return await getApi(`https://${domain}/api/v1/timelines/list/${id}`, at, param) as M.Toot[] }
export const getV1Bookmarks = async (domain: string, at: string, param?: R.TL) => { return await getApi(`https://${domain}/api/v1/bookmarks`, at, param, true) as TLLinking }
export const getV1Favourites = async (domain: string, at: string, param?: R.TL) => { return await getApi(`https://${domain}/api/v1/favourites`, at, param, true) as TLLinking }
export const getV1AccountsStatuses = async (domain: string, at: string, id: string, param?: R.UTL) => { return await getApi(`https://${domain}/api/v1/accounts/${id}/statuses`, at, param) as M.Toot[] }
export const getV1CutsomEmojis = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/custom_emojis`, at) as M.CustomEmoji[] }
export const getV1Notifications = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/notifications`, at) as M.Notification[] }
export const getV1NotificationId = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/notifications/${id}`, at) as M.Notification }
export const getV1Lists = async (domain: string, at: string, param?: R.HTL) => { return await getApi(`https://${domain}/api/v1/lists`, at, param) as M.List[] }
export const getV1UserInList = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/lists/${id}/accounts`, at) as M.Account[] }
export const getV1Toot = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/statuses/${id}`, at, {}) as M.Toot }
export const getV1Context = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/statuses/${id}/context`, at, {}) as M.Context }
export const getV1Faved = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/statuses/${id}/favourited_by`, at, {}) as M.Account[] }
export const getV1Bted = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/statuses/${id}/reblogged_by`, at, {}) as M.Account[] }
export const getV1Account = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/accounts/${id}`, at, {}) as M.Account }
export const getV1Follows = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/accounts/${id}/following`, at, {}) as M.Account[] }
export const getV1Follower = async (domain: string, at: string, id: string) => { return await getApi(`https://${domain}/api/v1/accounts/${id}/followers`, at, {}) as M.Account[] }
export const getV1Relationships = async (domain: string, at: string, ids: string[]) => { return await getApi(`https://${domain}/api/v1/accounts/relationships`, at, { id: ids }) as M.Relationship[] }
export const getV2Search = async (domain: string, at: string, param: R.Search) => { return await getApi(`https://${domain}/api/v2/search`, at, param) as M.Search }
export const getV1TrendStatuses = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/trends/statuses`, at) as M.Toot[] }
export const getV1TrendTags = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/trends/tags`, at) as M.Tag[] }
export const getV1TrendLink = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/trends/links`, at) as M.Card[] }
export const getV1Directory = async (domain: string, at: string, param: R.Directory) => { return await getApi(`https://${domain}/api/v1/directory`, at, param) as M.Account[] }
export const getV1Poll = async (domain: string, at: string, pollId: string) => { return await getApi(`https://${domain}/api/v1/polls/${pollId}`, at, {}) as M.Poll }
export const getV1Source = async (domain: string, at: string, tootId: string) => { return await getApi(`https://${domain}/api/v1/statuses/${tootId}/source`, at, {}) as M.Toot }
export const getV1History = async (domain: string, at: string, tootId: string) => { return await getApi(`https://${domain}/api/v1/statuses/${tootId}/history`, at, {}) as M.Toot[] }


export const postV2Media = async (domain: string, at: string, form: FormData) => { return await postApiMedia(`https://${domain}/api/v2/media`, at, form) as M.Media }
export const postV1Fav = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/favourite`, at) as M.Toot }
export const postV1Boost = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/reblog`, at) as M.Toot }
export const postV1Unfav = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/unfavourite`, at) as M.Toot }
export const postV1Unboost = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/unreblog`, at) as M.Toot }
export const postV1FRAuthorize = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/follow_requests/${id}/authorize`, at) as M.Relationship }
export const postV1FRReject = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/follow_requests/${id}/reject`, at) as M.Relationship }
export const postV1Statuses = async (domain: string, at: string, param: R.Status) => { return await postApi(`https://${domain}/api/v1/statuses`, at, param, true) as M.Toot }
export const putV1Statuses = async (domain: string, at: string, tootId: string, param: R.Status) => { return await putApi(`https://${domain}/api/v1/statuses/${tootId}`, at, param) as M.Toot }
export const postV1PushSubscribe = async (domain: string, at: string, param: R.PushSubscription) => { return await postApi(`https://${domain}/api/v1/push/subscription`, at, param) as M.PushSubscription }
export const deleteV1Status = async (domain: string, at: string, id: string) => { return await deleteApi(`https://${domain}/api/v1/statuses/${id}`, at) as M.Toot }
export const postV1Follow = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/follow`, at) as M.Relationship }
export const postV1UnFollow = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/unfollow`, at) as M.Relationship }
export const postV1Mute = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/mute`, at) as M.Relationship }
export const postV1UnMute = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/unmute`, at) as M.Relationship }
export const postV1Block = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/block`, at) as M.Relationship }
export const postV1UnBlock = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/accounts/${id}/unblock`, at) as M.Relationship }
export const postV1Pin = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/pin`, at) as M.Toot }
export const postV1UnPin = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/unpin`, at) as M.Toot }
export const postV1Bookmark = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/bookmark`, at) as M.Toot }
export const postV1UnBookmark = async (domain: string, at: string, id: string) => { return await postApi(`https://${domain}/api/v1/statuses/${id}/unbookmark`, at) as M.Toot }
export const postV1List = async (domain: string, at: string, title: string) => { return await postApi(`https://${domain}/api/v1/lists`, at, { title }) as M.List }
export const putV1List = async (domain: string, at: string, id:string, title: string) => { return await putApi(`https://${domain}/api/v1/lists/${id}`, at, { title }) as M.List }
export const deleteV1ListUser = async (domain: string, at: string, listId:string, userId: string) => { return await deleteApi(`https://${domain}/api/v1/lists/${listId}/accounts`, at, { 'account_ids[]': userId }) as M.List }
export const deleteV1List = async (domain: string, at: string, listId:string) => { return await deleteApi(`https://${domain}/api/v1/lists/${listId}`, at) as {}}
export const postV1ListUser = async (domain: string, at: string, listId: string,userId: string) => { return await postApi(`https://${domain}/api/v1/lists/${listId}/accounts`, at, { account_ids: [userId] }) as {} }
export const postV1Poll = async (domain: string, at: string, pollId: string, optionId: number[]) => { return await postApi(`https://${domain}/api/v1/polls/${pollId}/votes`, at, { choices: optionId }) as M.Poll }
export const postV1Translate = async (domain: string, at: string, tootId: string) => { return await postApi(`https://${domain}/api/v1/statuses/${tootId}/translate`, at, {}) as M.Translate }
