import AsyncStorage from '@react-native-async-storage/async-storage'
export const getItem = async (key: string) => {
    try {
        const data = await AsyncStorage.getItem(key)
        return data ? JSON.parse(data) : null
    } catch (e) {
        console.error(e)
        return false
    }
}
export const setItem = async (key: string, value: any) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}
export const removeItem = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key)
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}
export const pushItem = async (key: string, value: any) => {
    try {
        let data = await getItem(key)
        if(!data) data = []
        data.push(value)
        await setItem(key, data)
        return data
    } catch (e) {
        console.error(e)
        return false
    }
}
export const getCertainItem = async (key: string, needle: string, searchedValue: string) => {
    try {
        const data = await getItem(key)
        if(!data) return null
        for (let item of data) {
            if (item[needle] === searchedValue) return item
        }
        return null
    } catch (e) {
        console.error(e)
        return null
    }
}
export const getIndexedItem = async (key: string, index: number) => {
    try {
        const data = await getItem(key)
        if(!data) return false
        return data[index]
    } catch (e) {
        console.error(e)
        return false
    }
}
export const deleteAllItem = async () => {
    try {
        await AsyncStorage.clear()
    } catch (e) {
        console.error(e)
        return false
    }
}
export const deleteCertainItem = async (key: string, needle: string, searchedValue: string) => {
    try {
        const data = await getItem(key)
        if(!data) return false
        const newOne = []
        for (let item of data) {
            if (item[needle] !== searchedValue) newOne.push(item)
        }
        await setItem(key, newOne)
        return newOne
    } catch (e) {
        console.error(e)
        return false
    }
}
export const deleteIndexedItem = async (key: string, index: number) => {
    try {
        const data = await getItem(key)
        if(!data) return false
        const newOne = []
        let i = 0
        for (let item of data) {
            if (i !== index) newOne.push(item)
            i++
        }
        await setItem(key, newOne)
        return newOne
    } catch (e) {
        console.error(e)
        return false
    }
}
export const updateCertainItem = async (key: string, needle: string, searchedValue: string, value: any) => {
    try {
        let data = await getItem(key)
        if(!data) data = [value]
        const newOne = []
        for (let item of data) {
            if (item[needle] !== searchedValue) { 
                newOne.push(item) 
            } else {
                newOne.push(value) 
            }
        }
        await setItem(key, newOne)
        return newOne
    } catch (e) {
        console.error(e)
        return false
    }
}
export const updateIndexedItem = async (key: string, index: number, value: any) => {
    try {
        let data = await getItem(key)
        if(!data) data = [value]
        const newOne = []
        let i = 0
        for (let item of data) {
            if (i !== index) {
                newOne.push(item)
            } else {
                newOne.push(value) 
            }
            i++
        }
        await setItem(key, newOne)
        return newOne
    } catch (e) {
        console.error(e)
        return false
    }
}
