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
import { commonStyle } from '../utils/styles'
import { SetConfigContext } from '../utils/context/config'

interface FromRootToTimeline {
    timelines: TimelineProps[]
    loading: string | null
    setLoading: IState<Loading | null>
    setNewNotif: IState<boolean>
    reply: (id: string, acct: string) => void
    navigation: StackNavigationProp<ParamList, any>
}
export default (props: FromRootToTimeline) => {
    const { tl: targetTimelineId, changeTl } = React.useContext(ChangeTlContext)
    const { height: deviceHeight, width: deviceWidth } = useWindowDimensions()
    const styles = createStyle(deviceWidth)
    const appState = React.useRef(AppState.currentState)
    const [appStateVisible, setAppStateVisible] = useState(appState.current)
    const [targetTimelines, setTargetTimelines] = useState<TimelineProps[]>([])
    const { config } = useContext(SetConfigContext)
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
    const tlPerScreen = config.tlPerScreen
    useEffect(() => {
        const newTls = timelines.filter((d, i) => targetTimelineId.includes(i))
        setTargetTimelines(newTls)
    }, [targetTimelineId])

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        await baseStreaming()
        setRefreshing(false)
    }, [])
    const { timelines, loading, setLoading, setNewNotif, reply, navigation } = props
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
        console.log('re rendering', timeline.type)
        const moreLoad = mode === 'more'
        const updateLoad = mode === 'update'
        if (!timeline) return false
        if (loading === 'Loading...') return
        if (!mode) setLoading('Loading...')
        const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
        const isNoAuth = timeline.type === 'noAuth'
        const domain = isNoAuth ? timeline.timelineData.target : acct.domain
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
                    data = await api.getV1TimelinesHome(domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'local':
                    streamable = 'public:local'
                    data = await api.getV1TimelinesLocal(domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'noAuth':
                    streamable = 'public:local'
                    data = await api.getV1TimelinesLocal(domain, '', param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'public':
                    streamable = 'public'
                    data = await api.getV1TimelinesPublic(domain, acct.at, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'hashtag':
                    streamable = 'hashtag'
                    data = await api.getV1TimelinesHashtag(domain, acct.at, timeline.timelineData.target, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'list':
                    streamable = 'list'
                    data = await api.getV1TimelinesList(domain, acct.at, timeline.timelineData.target, param)
                    if (data.length) setMinId(data[data.length - 1].id)
                    break
                case 'bookmark':
                    const bkm = await api.getV1Bookmarks(domain, acct.at, param)
                    setMinId(bkm[1] || '')
                    data = bkm[0] || []
                    break
                case 'fav':
                    const fav = await api.getV1Favourites(domain, acct.at, param)
                    setMinId(fav[1] || '')
                    data = fav[0] || []
                    break
                case 'user':
                    data = await api.getV1AccountsStatuses(domain, acct.at, timeline.timelineData.target, param)
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
        if (streamable !== 'user' && !isNoAuth) {
            const wsParam = { type: 'subscribe', stream: streamable } as any
            if (streamable === 'list') wsParam.list = timeline.timelineData.target
            if (streamable === 'hashtag') wsParam.tag = timeline.timelineData.target
            const wss = ws[domain]
            console.log(wsParam)
            if (wss) wss.send(JSON.stringify(wsParam))
        }
    }
    const baseStreaming = async (update?: boolean) => {
        const updateStr = update ? 'update' : undefined
        let ii = 0
        for (const timeline of targetTimelines) {
            const i = targetTimelineId[ii]
            const acct = (await storage.getCertainItem('accounts', 'id', timeline.acct)) as S.Account
            const isNoAuth = timeline.type === 'noAuth'
            const domain = isNoAuth ? timeline.timelineData.target : acct.domain
            console.log('get stream of ', domain)
            const useThisStreamOn = []
            let j = 0
            for (const tl of targetTimelines) {
                if (tl.acct === acct.id) useThisStreamOn.push(j)
                j++
            }
            if (ws[domain] && (ws[domain]?.readyState || 9) <= 1) return loadTimeline(targetTimelineId[i], updateStr)
            const param = isNoAuth ? `stream=public:local` : `access_token=${acct.at}`
            const wss = new WebSocket(`wss://${domain}/api/v1/streaming/?${param}`)
            ws[domain] = wss
            setWs(ws)
            const waitOpen = () => new Promise((resolve) => {
                wss.onopen = async (e) => {
                    resolve(null)
                    console.log('onopen', new Date())
                    if(!isNoAuth) wss.send(JSON.stringify({ type: 'subscribe', stream: 'user' }))
                    for (let k = 0; k < targetTimelines.length; k++) {
                        loadTimeline(targetTimelineId[k], updateStr)
                    }
                }
            })
            await waitOpen()
            wss.onmessage = async (e) => {
                const { event } = JSON.parse(e.data)
                console.log('stream received', event)
                if (event === 'update' || event === 'conversation') {
                    //markers show中はダメ
                    const { stream, payload } = JSON.parse(e.data)
                    const obj = JSON.parse(payload)
                    const tlKeys = streamTypeToTlNumber(stream, targetTimelines, targetTimelineId)
                    for (const x of tlKeys) {
                        console.log(`update to`, x)
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
                    const tlKeys = streamTypeToTlNumber(stream, targetTimelines, targetTimelineId)
                    for (const x of tlKeys) {
                        const newTl = tootGet(x).map((item) => item.id !== obj.id ? item : obj)
                        tootUpdator(x, newTl)
                    }
                }
            }
            wss.onclose = async (e) => {
                console.log('closed', e)
                ws[domain] = null
                setWs(ws)
                //if (!killStreaming) await loadTimeline()
            }
            wss.onerror = async (e) => {
                console.log(e)
            }
            ii++
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
        console.log(targetTimelines, targetTimelineId)
        if (!targetTimelines.length) return
        for (const domain of Object.keys(ws)) {
            if ((ws[domain]?.readyState || 9) <= 1) ws[domain]?.close()
            ws[domain] = null
        }
        console.log('base streaming')
        baseStreaming()
    }, [targetTimelines])
    if (loading && !toots0.length) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text>{loading}</Text>
            </View>
        )
    }
    const moreLoad = (tlid: number) => {
        loadTimeline(tlid, 'more')
    }
    return (
        <View style={[styles.container]}>
            <View style={{ position: 'absolute', backgroundColor: 'red', width: 4, height: 4, opacity: ws ? 1 : 0, zIndex: 999, borderRadius: 2, marginLeft: 5 }} />
            <View style={commonStyle.horizonal}>
                {targetTimelines.map((targetTimeline, i) =>
                    <Timeline
                        key={targetTimeline.key}
                        timeline={targetTimeline}
                        tlId={targetTimelineId[i]}
                        loading={loading}
                        reply={reply}
                        navigation={navigation}
                        onRefresh={onRefresh}
                        moreLoad={moreLoad}
                        errorMsg={errorMsg}
                        toots={tootGet(targetTimelineId[i])}
                        refreshing={refreshing}
                        width={deviceWidth / tlPerScreen}
                    />)}
            </View>
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
const streamTypeToTlNumber = (stream: string[], tls: TimelineProps[], targetTimelineId: number[]) => {
    const ret = []
    let i = 0
    for (const tl of tls) {
        switch (tl.type) {
            case 'home':
                if (stream.includes('user')) ret.push(targetTimelineId[i])
                break
            case 'local':
                if (stream.includes('public:local')) ret.push(targetTimelineId[i])
                break
            case 'noAuth':
                if (stream.includes('public:local')) ret.push(targetTimelineId[i])
                break
            case 'public':
                if (stream.includes('public')) ret.push(targetTimelineId[i])
                break
            case 'hashtag':
                if (stream.includes('hashtag')) ret.push(targetTimelineId[i])
                break
            case 'list':
                if (stream.includes('list')) ret.push(targetTimelineId[i])
                break
        }
        i++
    }
    return ret
}