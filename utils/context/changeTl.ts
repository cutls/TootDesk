import React from 'react'
import { FlatList } from 'react-native'
import { IState } from '../../interfaces/ParamList'
export type IFlatList = React.RefObject<FlatList<any>> | undefined
interface IParam {
    changeTl: (tl: number, requireSleep?: boolean) => void
    tl: number
}
const changeTl = (tl: number, requireSleep?: boolean) => {}
export const changeTlContextDefaultValue: IParam = { changeTl, tl: 0 }
export const ChangeTlContext = React.createContext(changeTlContextDefaultValue)

