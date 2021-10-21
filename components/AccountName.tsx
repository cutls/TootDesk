import * as M from '../interfaces/MastodonApiReturns'
import React, { useState } from 'react'
import {  Dimensions } from 'react-native'
import { Text } from './Themed'
const deviceWidth = Dimensions.get('window').width
import twemoji from 'twemoji'
import HTML, { extendDefaultRenderer, HTMLContentModel } from 'react-native-render-html'
interface FromTootToAcctName {
    account: M.Account
}
const renderers = {
	img: extendDefaultRenderer('img', {
		contentModel: HTMLContentModel.mixed,
	}),
}
export const emojify = (content: string, emojis: M.Emoji[]) => {
    const twemojified = twemoji.parse(content).replace(/class="emoji"/g, `class="emoji" style="width: 1.1rem; height: 1.1rem"`)
    let emojified = twemojified
    for (let emoji of emojis) {
        const reg = new RegExp(`:${emoji.shortcode}:`, 'g')
        emojified = emojified.replace(reg, `<img src="${emoji.url}" style="width: 1.2rem; height: 1.2rem">`)
    }

    return emojified
}
export const AccountName = (props: FromTootToAcctName) => {
    const {account} = props
    return account.display_name ? (
        <HTML
            source={{ html: `<b>${emojify(account.display_name, account.emojis)}</b>` }}
            tagsStyles={{ b: { fontWeight: 'bold' } }}
            renderers={renderers}
            contentWidth={deviceWidth - 50}
        />
    ) : (
        <Text style={{ fontWeight: 'bold' }}>{account.username}</Text>
    )
}