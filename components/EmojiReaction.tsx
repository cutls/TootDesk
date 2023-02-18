import React, { useContext } from 'react'
import { StyleSheet, Image, useColorScheme } from 'react-native'
import { Text, View, TouchableOpacity } from './Themed'
import * as M from '../interfaces/MastodonApiReturns'
import { SetConfigContext } from '../utils/context/config'
import { commonStyle } from '../utils/styles'
import { doReaction } from '../utils/changeStatus'
interface FromTootToEReaction {
    toot: M.Toot
    acctId: string
}
export default function EmojiReaction(props: FromTootToEReaction) {
    const { config } = useContext(SetConfigContext)
    const theme = useColorScheme()
    const isDark = theme === 'dark'
    const styles = createStyle(isDark)
    const { toot, acctId } = props
    if (!toot.emoji_reactions) return null
    const renderReaction = (reaction: M.EmojiReaction) => {
        const width = reaction.count.toString().length * 9 + 30
        const isMe = reaction.me
        if (!reaction.count) return null
        return <TouchableOpacity key={reaction.name} onPress={() => doReaction(!reaction.me, reaction.name, acctId, toot.id)} style={[styles.reactions, { width, backgroundColor: isMe ? '#b8d1e3' : 'transparent' }]}>
            {reaction.url ? <Image source={{ uri: config.showGif ? reaction.url : reaction.static_url }} style={{ width: 18, height: 18 }} /> : <Text>{reaction.name}</Text>}
            <Text>{reaction.count}</Text>
        </TouchableOpacity>
    }
    return <>
        <View style={commonStyle.horizonal}>
            {toot.emoji_reactions.map((r) => renderReaction(r))}
        </View>
    </>
}

function createStyle(isDark: boolean) {
    return StyleSheet.create({
        reactions: {
            display: 'flex',
            flexDirection: 'row',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: isDark ? 'white' : 'black',
            width: 50,
            padding: 5,
            borderRadius: 5,
            marginRight: 10
        }
    })
}