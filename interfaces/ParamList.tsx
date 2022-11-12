import TimelineProps from "./TimelineProps"

export type ParamList = {
	Root: undefined | { screen: string }
	AccountManager: undefined | { screen: string, code: string, state: string }
	Toot: undefined | { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
	AccountDetails: undefined | { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
	TimelineOnly: { timeline: TimelineProps }
}
export type IState<T> = React.Dispatch<React.SetStateAction<T>>