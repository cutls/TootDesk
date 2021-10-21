import axios from 'axios'
import * as M from '../interfaces/MastodonApiReturns'
import * as R from '../interfaces/MastodonApiRequests'
const getApi = async (url: string, at: string, param?: any, needHeader?: boolean) => {
    const searchParams = new URLSearchParams(param)
    try {
        const api = await axios.get(`${url}?${searchParams}`, {
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'application/json'
            }
        })
        if(needHeader) {
            const link = api.headers['link']
            try {
                const min_id = link.match(/<(.+)>/)[1].match(/min_id=([0-9]+)/)[1]
                return [api.data, min_id]
            } catch (e) {

            }
        }
        return api.data
    } catch (e) {
		console.error(`${url}?${searchParams}`)
        return e as Error
    }
}
const postApi = async (url: string, at: string, param?: any) => {
    try {
        const api = await axios.post(`${url}`, param, {
            headers: {
                Authorization: `Bearer ${at}`,
                'content-type': 'application/json'
            }
        })
        return api.data
    } catch (e) {
        return e as Error
    }
}
type TLLinking = [M.Toot[], string]
export const getV1AccountsVerifyCredentials = async (domain: string, at: string) => { return await getApi(`https://${domain}/api/v1/accounts/verify_credentials`, at) as M.Credential}
export const getV1TimelinesHome = async (domain: string, at: string, param?: R.HTL) => { return await getApi(`https://${domain}/api/v1/timelines/home`, at, param) as M.Toot[]}
export const getV1TimelinesLocal = async (domain: string, at: string, param?: R.FTL) => { return await getApi(`https://${domain}/api/v1/timelines/public`, at, {local: true, ...param}) as M.Toot[]}
export const getV1TimelinesPublic = async (domain: string, at: string, param?: R.FTL) => { return await getApi(`https://${domain}/api/v1/timelines/public`, at, {local: false, ...param}) as M.Toot[]}
export const getV1TimelinesHashtag = async (domain: string, at: string, tag: string,  param?: R.TTL) => { return await getApi(`https://${domain}/api/v1/timelines/tag/${tag}`, at, param) as M.Toot[]}
export const getV1TimelinesList = async (domain: string, at: string, id: string,  param?: R.TL) => { return await getApi(`https://${domain}/api/v1/timelines/list/${id}`, at, param) as M.Toot[]}
export const getV1Bookmarks = async (domain: string, at: string, param?: R.TL) => { return await getApi(`https://${domain}/api/v1/timelines/bookmarks`, at, param) as TLLinking}
export const getV1Favourites = async (domain: string, at: string, param?: R.TL) => { return await getApi(`https://${domain}/api/v1/timelines/favourites`, at, param) as TLLinking}
export const getV1AccountsStatuses = async (domain: string, at: string, id: string, param?: R.UTL) => { return await getApi(`https://${domain}/api/v1/accounts/${id}/statuses`, at, param) as M.Toot[]}