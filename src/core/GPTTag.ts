export class GPTTag extends Map<string, any> { }
export type GPTTagError<T extends Error> = { error: T }

export type GPTTagReflect = {
    wasCorrect: boolean
}