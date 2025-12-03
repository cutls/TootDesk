export type IState<T> = (value: React.SetStateAction<T>) => void
export type ComposeMode = 'compose' | 'acct' | 'menu' | 'emoji' | 'schedule' | 'poll'
