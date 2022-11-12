import React from 'react'
import { FlatList } from 'react-native'
import { IState } from '../../interfaces/ParamList'
export type IFlatList = React.RefObject<FlatList<any>> | undefined
interface IParam {
    setShow: IState<boolean>
    show: boolean
    flatList: IFlatList
    setFlatList: IState<IFlatList>
}
const setShow: any = null
const setFlatList: any = null
export const topBtnContextDefaultValue: IParam = { show: false, setShow, flatList: undefined, setFlatList }
export const TopBtnContext = React.createContext(topBtnContextDefaultValue)

