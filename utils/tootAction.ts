import { Account, Toot } from "../interfaces/MastodonApiReturns";
import { IState } from "../interfaces/ParamList";
import * as api from './api'
import * as storage from './storage'
import * as S from '../interfaces/Storage'
import * as M from '../interfaces/MastodonApiReturns'
import moment, { unix } from "moment-timezone";

export const translate = async (acctId: string, id: Toot['id']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.postV1Translate(acct.domain, acct.at, id)
        console.log(data)
        return `${data.content} (${data.provider})`
    } catch (e: any) {
        return e.toString()
    }
}
export const resolveStatus = async (acctId: string, url: Toot['url']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.getV2Search(acct.domain, acct.at, { q: url, resolve: true })
        console.log(data)
        if (data.statuses) return data.statuses[0] || null
        return null
    } catch (e: any) {
        return null
    }
}
export const resolveAccount = async (acctId: string, url: Account['url']) => {
    try {
        const acct = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
        const data = await api.getV2Search(acct.domain, acct.at, { q: url, resolve: true })
        console.log(data)
        if (data.accounts) return data.accounts[0] || null
        return null
    } catch (e: any) {
        return null
    }
}
export const suggest = async (startPosition: number, inputText: string, acctId: string): Promise<[M.CustomEmoji[] | M.Account[] | M.Search['hashtags'], string]> => {
    const first1 = inputText.slice(0, startPosition)
    const firstArr = first1.split(' ')
    const first = firstArr[firstArr.length - 1]
    const emojiRegExp = /:([a-zA-Z0-9_]{3,})/
    const tagRegExp = /#([^- ]|\S){3,}\s?/
    const acctRegExp = /@[a-zA-Z0-9_]{3,}/
    const emojiM = first.match(emojiRegExp)
    const tagM = first.match(tagRegExp)
    const acctM = first.match(acctRegExp)
    const unixTime = moment().unix()
    if (emojiM) {
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            const availableEmoji = await storage.getCertainItem('emojis', 'domain', domain) as S.Emoji | null
            let useData: M.CustomEmoji[] = []
            if (!availableEmoji || availableEmoji.updated + 600 < unixTime) {
                console.log('api access')
                const data =  await api.getV1CutsomEmojis(domain, at)
                useData = data
                const storedData: S.Emoji = {
                    domain,
                    emojis: data,
                    updated: unixTime
                }
                if (!availableEmoji) {
                    if(await storage.getItem('emojis')) {
                        await storage.pushItem('emojis', storedData)
                    } else {
                        await storage.setItem('emojis', [storedData])
                    }
                } else {
                    await storage.updateCertainItem('emojis', 'domain', domain, storedData)
                }  
            } else {
                console.log('restored access')
                useData = availableEmoji.emojis
            }
            const filteredEmoji = useData.filter((e) => !!e.shortcode.match(emojiM[1]))
            return [filteredEmoji, emojiM[0]]
        } catch (e: any) {
            console.error(e)
        }
    } else if (tagM || acctM) {
        try {
            const q = { q: '' }
            if (tagM) q.q = tagM[0]
            if (acctM) q.q = acctM[0]
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            const data = await api.getV2Search(domain, at, q)
            if (data.hashtags.length && tagM) return [data.hashtags, tagM[0].replace(' ', '')]
            if (data.accounts.length && acctM) return [data.accounts, acctM[0]]
            return [[], '']
        } catch (e: any) {
            console.error(e)
        }
    }
    return [[], '']
}