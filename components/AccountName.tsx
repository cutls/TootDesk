import * as M from '../interfaces/MastodonApiReturns'
import React, { useState } from 'react'
import { Dimensions } from 'react-native'
import { Text } from './Themed'
const deviceWidth = Dimensions.get('window').width
import twemoji from 'twemoji'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
    img: defaultHTMLElementModels.img.extend({
        contentModel: HTMLContentModel.mixed,
    })
}
interface FromTootToAcctName {
    account: M.Account
    miniEmoji?: boolean
    fontSize?: number
    showWithoutEllipsis?: boolean
}
export const emojify = (content: string, emojis: M.Emoji[], miniEmoji?: boolean) => {
    const twemojified = twemoji.parse(content).replace(/class="emoji"/g, `class="emoji" style="width: ${miniEmoji ? '1' : '1.1'}rem; height: ${miniEmoji ? '0.7' : '1.1'}rem"`)
    let emojified = twemojified
    for (let emoji of emojis) {
        const reg = new RegExp(`:${emoji.shortcode}:`, 'g')
        emojified = emojified.replace(reg, `<img src="${emoji.url}" style="width: ${miniEmoji ? '0.7' : '1.2'}rem; height: ${miniEmoji ? '0.7' : '1.2'}rem">`)
    }

    return emojified
}
export const AccountName = (props: FromTootToAcctName) => {
    const { account, miniEmoji, fontSize: fsRaw, showWithoutEllipsis } = props
    const fontSize = fsRaw ? fsRaw : 15
    const textProps = showWithoutEllipsis ? {} : { numberOfLines: 1 }
    return account.display_name ? (
        <HTML
            source={{ html: `<b style="font-size: ${fontSize}px;">${emojify(account.display_name, account.emojis, miniEmoji)}</b>` }}
            tagsStyles={{ b: { fontWeight: 'bold' } }}
            customHTMLElementModels={renderers}
            contentWidth={deviceWidth - 50}
            defaultTextProps={textProps}
        />
    ) : (
        <Text style={{ fontWeight: 'bold', fontSize }}>{account.username}</Text>
    )
}