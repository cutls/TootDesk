import React, { useState } from 'react'
import { StyleSheet, Platform, Image, Dimensions } from 'react-native'
import { Text, View, TextInput, Button } from './Themed'
import * as Alert from '../utils/alert'
import * as M from '../interfaces/MastodonApiReturns'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { commonStyle } from '../utils/styles'
import * as S from '../interfaces/Storage'
import moment from 'moment'
import deepClone from '../utils/deepClone'
import * as storage from '../utils/storage'
import * as api from '../utils/api'
interface FromTootToPoll {
    acctId: string
    poll: M.Poll
}

export default (props: FromTootToPoll) => {
    const { poll: pollRaw, acctId } = props
    const [showResult, setShowResult] = useState(pollRaw.voted)
    const [poll, setPoll] = useState(pollRaw)
    const [options, setOptions] = useState(poll.options)
    const insertStyle = { backgroundColor: '#b8d1e3' }
    const select = async (i: number) => {
        if (poll.multiple) {
            const newOptions = deepClone<M.PollOption[]>(options)
            newOptions[i].TheDeskSelected = !newOptions[i].TheDeskSelected
            setOptions(newOptions)
        } else {
            try {
                const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
                const pollNew = await api.postV1Poll(domain, at, poll.id, [i])
                setPoll(pollNew)
                setShowResult(true)
                setOptions(pollNew.options)
            } catch (e: any) {
                Alert.alert(`Error`, e.toString())
            }
        }
    }
    const refresh = async () => {
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            const pollNew = await api.getV1Poll(domain, at, poll.id)
            setPoll(pollNew)
            setShowResult(pollNew.voted)
            setOptions(pollNew.options)
        } catch (e: any) {
            Alert.alert(`Error`, e.toString())
        }
    }
    const pollMultiple = async () => {
        const choice: number[] = []
        let i = 0
        for (const o of options) {
            if (o.TheDeskSelected) choice.push(i)
            i++
        }
        try {
            const { domain, at } = (await storage.getCertainItem('accounts', 'id', acctId)) as S.Account
            const pollNew = await api.postV1Poll(domain, at, poll.id, choice)
            setPoll(pollNew)
            setShowResult(true)
            setOptions(pollNew.options)
        } catch (e: any) {
            Alert.alert(`Error`, e.toString())
        }
    }

    return (
        <View style={[]}>
            {
                showResult ?
                    <>{options.map((d, i) =>
                        <View style={[styles.option, commonStyle.horizonal]}>
                            <Text>{d.title}: {d.votes_count}({poll.voters_count && Math.floor((d.votes_count || 0) / poll.voters_count * 100)}%){poll.own_votes.includes(i) && ` ✅`}</Text>
                        </View>
                    )}
                        <View style={[commonStyle.horizonal, { marginVertical: 10 }]}>
                            <Text style={{ color: '#9a9da1' }}>{poll.votes_count}票{poll.multiple ? `(${poll.voters_count}人)` : ''}</Text>
                            <Text style={{ color: '#9a9da1', marginHorizontal: 5 }}>{moment(poll.expires_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}</Text>
                            <TouchableOpacity onPress={() => refresh()}>
                                <Text style={{ color: '#9a9da1', textDecorationLine: 'underline', marginHorizontal: 5 }}>更新</Text>
                            </TouchableOpacity>
                            {!poll.voted && <TouchableOpacity onPress={() => setShowResult(false)}>
                                <Text style={{ color: '#9a9da1', textDecorationLine: 'underline', marginHorizontal: 5 }}>投票する</Text>
                            </TouchableOpacity>}
                        </View>
                    </>
                    :
                    <>
                        {options.map((d, i) =>
                            <TouchableOpacity style={[styles.option, d.TheDeskSelected ? insertStyle : {}]} onPress={() => select(i)}>
                                <Text>{d.title}</Text>
                            </TouchableOpacity>
                        )}
                        {poll.multiple && <Button title="投票" onPress={() => pollMultiple()} />}
                        <View style={[commonStyle.horizonal, { marginVertical: 10 }]}>
                            <Text style={{ color: '#9a9da1' }}>{poll.votes_count}票{poll.multiple ? `(${poll.voters_count}人)` : ''}</Text>
                            <Text style={{ color: '#9a9da1', marginHorizontal: 5 }}>{moment(poll.expires_at, 'YYYY-MM-DDTHH:mm:ss.000Z').fromNow()}</Text>
                            <TouchableOpacity onPress={() => refresh()}>
                                <Text style={{ color: '#9a9da1', textDecorationLine: 'underline', marginHorizontal: 5 }}>更新</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowResult(true)}>
                                <Text style={{ color: '#9a9da1', textDecorationLine: 'underline', marginHorizontal: 5 }}>結果だけ見る</Text>
                            </TouchableOpacity>
                        </View>
                    </>
            }
        </View >
    )
}
const styles = StyleSheet.create({
    tapToPoll: {
        color: '#aaa'
    },
    option: {
        borderWidth: 1,
        borderColor: 'black', // in dark mode?
        padding: 6,
        borderRadius: 3,
        marginVertical: 3
    }
})