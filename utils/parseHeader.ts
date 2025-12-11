interface IParam {
	url: string
	externals: Record<string, string>
	urlParams: Record<string, string>
}
export const parseHeader = (header: string) => {
	//<https://6m.cutls.dev/api/v1/accounts/115469566062452004/following?max_id=30>; rel="next"
	const parts = header.split(/,\s*</)
	const ret: Record<string, IParam> = {}
	for (const part of parts) {
		const m = part.match(/<?([^>]*)>(.*)/)
		if (!m) continue
		const linkUrl = m[1]
		const exts = m[2]
			.split(';')
			.map((s) => s.trim())
			.slice(1)
		let rel = ''
		const extObj: Record<string, string> = {}
		for (const ext of exts) {
			const [attr, valueR] = ext.split('="')
			const value = valueR.slice(0, -1)
			if (attr === 'rel') rel = value
			extObj[attr] = value
		}
		if (rel) {
			const queryS = linkUrl.match(/\?.+$/)
			const query = queryS ? queryS[0] : ''
            const e: Record<string, string> = {}
            for (const [k, v] of new URLSearchParams(query).entries()) e[k] = v
			ret[rel] = { url: linkUrl, externals: extObj, urlParams: e }
		}
	}
	return ret
}
