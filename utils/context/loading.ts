import React from 'react'
import { FlatList } from 'react-native'
import { IState } from '../../interfaces/ParamList'
export type IFlatList = React.RefObject<FlatList<any>> | undefined
interface IParam {
    setLoading: IState<string | null>
    loading: string | null
}
const setLoading: any = null
export const loadingContextDefaultValue: IParam = { loading: null, setLoading }
export const LoadingContext = React.createContext(loadingContextDefaultValue)

