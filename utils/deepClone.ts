export default <T>(item: any) => {
    return JSON.parse(JSON.stringify(item)) as T
}