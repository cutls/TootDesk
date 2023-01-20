import React, { useContext, useEffect, useRef, useState } from 'react'
import TimelineProps from '../interfaces/TimelineProps'
import { StyleSheet, AppState, Dimensions, FlatList, RefreshControl, AppStateStatus, useWindowDimensions } from 'react-native'
import { Text, View } from './Themed'
import Toot from './Toot'
import * as M from '../interfaces/MastodonApiReturns'
import * as storage from '../utils/storage'
import * as S from '../interfaces/Storage'
import * as api from '../utils/api'
import * as Alert from '../utils/alert'
import deepClone from '../utils/deepClone'
import { RefObject } from 'react'
import { StackNavigationProp } from '@react-navigation/stack'
import { ParamList, IState, Loading } from '../interfaces/ParamList'
import { TopBtnContext } from '../utils/context/topBtn'
import { ChangeTlContext } from '../utils/context/changeTl'
import Timeline from './Timeline'

interface FromRootToTimeline {
    timelines: TimelineProps[]
    targetTimelines: TimelineProps[]
    imgModalTrigger: (arg0: string[], arg1: number, show: boolean) => void
    loading: string | null
    setLoading: IState<Loading | null>
    setNewNotif: IState<boolean>
    reply: (id: string, acct: string) => void
    navigation: StackNavigationProp<ParamList, any>
}
export default (props: FromRootToTimeline) => {
    const { tl } = React.useContext(ChangeTlContext)
	const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
	const styles = createStyle(deviceWidth)
    const appState = React.useRef(AppState.currentState)
    const [appStateVisible, setAppStateVisible] = useState(appState.current)
    const [toots0, setToots0] = useState<M.Toot[]>([])
    const toots0Ref = useRef<M.Toot[]>()
    toots0Ref.current = toots0
    const [toots1, setToots1] = useState<M.Toot[]>([])
    const toots1Ref = useRef<M.Toot[]>()
    toots1Ref.current = toots1
    const [toots2, setToots2] = useState<M.Toot[]>([])
    const toots2Ref = useRef<M.Toot[]>()
    toots2Ref.current = toots2
    const [toots3, setToots3] = useState<M.Toot[]>([])
    const toots3Ref = useRef<M.Toot[]>()
    toots3Ref.current = toots3
    const [ids, setIds] = useState<string[]>([])
    const [minId, setMinId] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [ws, setWs] = useState<{ [domain: string]: WebSocket | null }>({})
    const [refreshing, setRefreshing] = useState(false)
    const [onScroll, setOnScroll] = useState(false)

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        await baseStreaming()
        setRefreshing(false)
    }, [])
    const { timelines, loading, setLoading, setNewNotif, reply, navigation, targetTimelines, imgModalTrigger } = props
    let ct = 0
    const tootUpdator = (tlId: number, item: M.Toot[]) => {
        if (tlId === 0) setToots0(deepClone(item))
        if (tlId === 1) setToots1(deepClone(item))
        if (tlId === 2) setToots2(deepClone(item))
        if (tlId === 3) setToots3(deepClone(item))
    }
    const tootGet = (tlId: number) => {
        if (tlId === 0) return toots0Ref.current || []
        if (tlId === 1) return toots1Ref.current || []
        if (tlId === 2) return toots2Ref.current || []
        if (tlId === 3) return toots3Ref.current || []
        return toots0Ref.current || []
    }
    const loadTimeline = async (tlId: number, mode?: 'more' | 'update') => {
        //if (!mode) setToots([])
        const timeline = timelines[tlId]
        console.log('re rendering')
        const moreLoad = mode === 'more'
        const updateLoad = mode === 'update'
        if (!timeline) return false
        if (loading === 'Loading...') return
        if (!mode) setLoading('Loading...')
        const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
        let streamable: string | false = false
        let data: M.Toot[] = []
        const param = {} as any
        if (moreLoad) param.max_id = minId
        if (updateLoad) return console.log('no deps')
        if (updateLoad) param.since_id = tootGet(tlId)[0].id
        try {
            switch (timeline.type) {
                case 'home':
                    streamable = 'user'
                    data = await api.getV1TimelinesHome(acct.domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'local':
                    streamable = 'public:local'
                    data = await api.getV1TimelinesLocal(acct.domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'public':
                    streamable = 'public'
                    data = await api.getV1TimelinesPublic(acct.domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'hashtag':
                    streamable = 'hashtag'
                    data = await api.getV1TimelinesHashtag(acct.domain, acct.at, timeline.timelineData.target, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'list':
                    streamable = 'list'
                    data = await api.getV1TimelinesList(acct.domain, acct.at, timeline.timelineData.target, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'bookmark':
                    const bkm = await api.getV1Bookmarks(acct.domain, acct.at, param)
                    setMinId(bkm[1] || '')
                    data = bkm[0] || []
                    break
                case 'fav':
                    const fav = await api.getV1Favourites(acct.domain, acct.at, param)
                    setMinId(fav[1] || '')
                    data = fav[0] || []
                    break
                case 'user':
                    data = await api.getV1AccountsStatuses(acct.domain, acct.at, timeline.timelineData.target, param)
                    break
            }
        } catch (e: any) {
            console.error('Error', e)
            setErrorMsg(e.toString())
        }
        if (moreLoad) {
            const clone = tootGet(tlId)
            const newData = clone.concat(data)
            tootUpdator(tlId, newData)
            return true
        } else if (updateLoad) {
            const clone = tootGet(tlId)
            const newData = data.concat(clone)
            tootUpdator(tlId, newData)
        } else {
            tootUpdator(tlId, data)
        }
        setLoading(null)
        if (streamable !== 'user') {
            const wsParam = { type: 'subscribe', stream: streamable } as any
            if (streamable === 'list') wsParam.list = timeline.timelineData.target
            if (streamable === 'hashtag') wsParam.tag = timeline.timelineData.target
            const wss = ws[acct.domain]
            if (wss) wss.send(JSON.stringify(wsParam))
        }
    }
    const baseStreaming = async (update?: boolean) => {
        const updateStr = update ? 'update' : undefined
        let i = 0
        console.log(targetTimelines)
        for (const timeline of targetTimelines) {
            const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
            console.log('get stream of ', acct.domain)
            if (ws[acct.domain] && (ws[acct.domain]?.readyState || 9) <= 1) return loadTimeline(i, updateStr)
            const useThisStreamOn = []
            let j = 0
            for (const tl of targetTimelines) {
                if (tl.acct === acct.id) useThisStreamOn.push(j)
                j++
            }
            const wss = new WebSocket(`wss://${acct.domain}/api/v1/streaming/?access_token=${acct.at}`)
            ws[acct.domain] = wss
            setWs(ws)
            wss.onopen = async (e) => {
                console.log('onopen', new Date())
                wss.send(JSON.stringify({ type: 'subscribe', stream: 'user' }))
                for (let i = 0; i < targetTimelines.length; i++) {
                    loadTimeline(i, updateStr)
                }
            }
            wss.onmessage = async (e) => {
                const { event } = JSON.parse(e.data)
                console.log('stream received', event)
                if (event === 'update' || event === 'conversation') {
                    //markers show中はダメ
                    const { stream, payload } = JSON.parse(e.data)
                    const obj = JSON.parse(payload)
                    const tlKeys = streamTypeToTlNumber(stream, targetTimelines)
                    for (const x of tlKeys) {
                        const t = tootGet(x)
                        const cloneX = deepClone<M.Toot[]>(t)
                        cloneX.unshift(obj)
                        tootUpdator(x, cloneX)
                    }
                } else if (event === 'notification') {
                    setNewNotif(true)
                } else if (event === 'delete') {
                    const { payload } = JSON.parse(e.data)
                    for (let i = 0; i < targetTimelines.length; i++) {
                        const newTl = tootGet(i).filter((item) => item.id !== payload)
                        tootUpdator(i, newTl)
                    }
                } else if (event === 'status.update') {
                    const { payload, stream } = JSON.parse(e.data)
                    const obj: M.Toot = JSON.parse(payload)
                    const tlKeys = streamTypeToTlNumber(stream, targetTimelines)
                    for (const x of tlKeys) {
                        const newTl = tootGet(x).map((item) => item.id !== obj.id ? item : obj)
                        tootUpdator(x, newTl)
                    }
                }
            }
            wss.onclose = async () => {
                console.log('closed')
                ws[acct.domain] = null
                setWs(ws)
                //if (!killStreaming) await loadTimeline()
            }
            wss.onerror = async (e) => {
                console.log(e)
            }
            i++
        }
    }
    useEffect(() => {
        const _handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if ((nextAppState === 'inactive' || nextAppState === 'background') && appState.current === 'active') {
                console.log('App has come to the background!')
            }
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!')
                await baseStreaming(true)
            }
            appState.current = nextAppState
            setAppStateVisible(appState.current)
        }
        const e = AppState.addEventListener('change', _handleAppStateChange)
        return () => {
            e.remove()
        }
    }, [])
    useEffect(() => {
        console.log(`baseStreaming`)
        baseStreaming()
    }, [])
    if (loading && !toots0.length) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>{loading}</Text>
            </View>
        )
    }
    const moreLoad = (tlid: number) => {
        //loadTimeline(tlid, 'more')
    }
    return (
        <View style={[styles.container]}>
            {!!loading && <Text>{loading}</Text>}
            <View style={{ position: 'absolute', backgroundColor: 'red', width: 4, height: 4, opacity: ws ? 1 : 0, zIndex: 999, borderRadius: 2, marginLeft: 5 }} />
            <Timeline
                timeline={targetTimelines[0]}
                tlId={0}
                imgModalTrigger={imgModalTrigger}
                loading={loading}
                reply={reply}
                navigation={navigation}
                onRefresh={onRefresh}
                moreLoad={moreLoad}
                errorMsg={errorMsg}
                toots={tootGet(0)}
                refreshing={refreshing}
                width={deviceWidth}
            />
        </View>
    )
}
function createStyle(deviceWidth: number) {
   return StyleSheet.create({
        center: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        container: {
            flex: 0,
            width: deviceWidth,
            backgroundColor: 'transparent',
            marginBottom: 0,
        },
    })
}
const streamTypeToTlNumber = (stream: string, tls: TimelineProps[]) => {
    const ret = []
    let i = 0
    for (const tl of tls) {
        switch (tl.type) {
            case 'home':
                if (stream.includes('user')) ret.push(i)
                break
            case 'local':
                if (stream.includes('public:local')) ret.push(i)
                break
            case 'public':
                if (stream.includes('public')) ret.push(i)
                break
            case 'hashtag':
                if (stream.includes('hashtag')) ret.push(i)
                break
            case 'list':
                if (stream.includes('list')) ret.push(i)
                break
        }
        i++
    }
    return ret
}