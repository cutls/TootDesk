import * as M from '../interfaces/MastodonApiReturns'
import React, { useContext, useState } from 'react'
import { Dimensions, useColorScheme, useWindowDimensions } from 'react-native'
import { Text } from './Themed'
import twemoji from 'twemoji'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { SetConfigContext } from '../utils/context/config'
import { stripTags } from '../utils/stringUtil'
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
    width: number
}
export const emojify = (content: string, emojis: M.Emoji[], miniEmoji?: boolean, showGif=true) => {
    //const twemojified = twemoji.parse(content, { }).replace(/class="emoji"/g, `class="emoji" style="width: ${miniEmoji ? '1' : '1.1'}rem; height: ${miniEmoji ? '0.7' : '1.1'}rem"`)
    const twemojified = content
    let emojified = twemojified
    for (let emoji of emojis) {
        const reg = new RegExp(`:${emoji.shortcode}:`, 'g')
        const emojiHtmlRaw = `<img src="${showGif ? emoji.url : emoji.static_url}" style="width: ${miniEmoji ? '0.7' : '1.2'}rem; height: ${miniEmoji ? '0.7' : '1.2'}rem;">`
        const isOnlyEmojiReg = new RegExp(`^\s?:${emoji.shortcode}:\s?$`, 'g')
        // なぜか絵文字だけのpostだった場合に、その絵文字が中央に寄ってしまうので、ゼロ幅スペースをいれて誤魔化す
        const isOnlyEmoji = !!stripTags(content).match(isOnlyEmojiReg)
        const emojiHtml = `${isOnlyEmoji ? '​' : ''}${emojiHtmlRaw}${isOnlyEmoji ? '' : ''}`
        emojified = emojified.replace(reg, emojiHtml)
    }

    return emojified
}
const tagStyle = { b: { fontWeight: 'bold' } } as const
export const AccountName = (props: FromTootToAcctName) => {
    const { account, miniEmoji, fontSize: fsRaw, showWithoutEllipsis, width } = props
	const { config } = useContext(SetConfigContext)
    const fontSize = fsRaw ? fsRaw : 15
    const textProps = showWithoutEllipsis ? {} : { numberOfLines: 1 }
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const txtColor = isDark ? 'white' : 'black'
    return account.display_name ? (
        <HTML
            source={{ html: `<b style="font-size: ${fontSize}px;color: ${txtColor}">${emojify(account.display_name, account.emojis, miniEmoji, config.showGif)}</b>` }}
            tagsStyles={tagStyle}
            customHTMLElementModels={renderers}
            contentWidth={width - 50}
            defaultTextProps={textProps}
        />
    ) : (
        <Text style={{ fontWeight: 'bold', fontSize }}>{account.username}</Text>
    )
}