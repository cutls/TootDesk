export type ParamList = {
	Root: undefined | { screen: string }
	AccountManager: undefined | { screen: string, code: string, state: string }
	Toot: undefined | { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
	AccountDetails: undefined | { at?: string, notfId?: string, domain?: string, notification: boolean, acctId?: string, id?: string }
}
