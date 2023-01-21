import React from 'react'
import { configInit, IConfig } from '../../interfaces/Config'
import { IState } from '../../interfaces/ParamList'
interface IParam {
    config: IConfig
    setConfig: IState<IConfig>
}
export const configDefaultValue: IParam = { config: configInit, setConfig: () => {} }
export const SetConfigContext = React.createContext(configDefaultValue)

