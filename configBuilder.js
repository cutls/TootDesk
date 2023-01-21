const fs = require('fs')
const templateStr = fs.readFileSync('./app.template.json')
const template = JSON.parse(templateStr)
const currentStr = fs.readFileSync('./app.json')
const current = JSON.parse(currentStr)
const prettier = require("prettier")
async function main() {
    const v = await readUserInput(`What is the new version versioning?(current: ${current.expo.version}): `);
    const versionCode = current.expo.android.versionCode
    const newCode = versionCode + 1
    template.expo.version = v || current.expo.version
    template.expo.android.versionCode = newCode
    template.expo.ios.buildNumber = `${newCode}`
    const tJson = JSON.stringify(template)
    const parsed = prettier.format(tJson, { parser: 'json' })
    fs.writeFileSync('./app.json', parsed)
}
main()


function readUserInput(question) {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve, reject) => {
        readline.question(question, (answer) => {
            resolve(answer)
            readline.close()
        })
    })
}