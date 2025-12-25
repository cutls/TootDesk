export const stripTags = (str: string, allowed?: string) => {
	if (!str) {
		return ''
	}
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')
	const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi,
		commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
	return str.replace(commentsAndPhpTags, '').replace(tags, ($0, $1) => {
		if (!allowed) return ''
		return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
	})
}
export const mb2xCount = (str: string) => {
	const ascii = str.match(/[ -~]/g)?.length || 0
	return str.length * 2 - ascii
} 
export const capitalizeFirst = (str: string) => {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}
