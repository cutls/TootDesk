export const stripTags = function (str: string, allowed?: string) {
	if (!str) {
		return ''
	}
	allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('')
	const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>?/gi,
		commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
	return str.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
		if (!allowed) return ''
		return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
	})
}
export const mb2xCount = function (str: string) {
	const ascii = str.match(/[ -~]/g)?.length || 0
	return str.length * 2 - ascii
} 