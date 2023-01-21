import React from 'react'
import { FlatList } from 'react-native'
import { IState } from '../../interfaces/ParamList'
interface IImageModalParam {
    url: string[]
    i: number
    show: boolean
}
interface IParam {
    imageModal: IImageModalParam
    setImageModal: IState<IImageModalParam>
}
const init = {
    url: [''],
    i: 0,
    show: false,
}
const setImageModal: any = () => { }
export const imageModalDefaultValue: IParam = { setImageModal, imageModal: init }
export const ImageModalContext = React.createContext(imageModalDefaultValue)

