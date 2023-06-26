export type Todo = {
    id: number
    text: stringc
    completed: boolean
    labels: string[]
}

export type NewTodoPayload = {
    text: string,
    labels: number[]
}

export type UpdateTodoPayload = Partial<Omit<Todo, 'id'>> & {
    id: number
}

export type Label = {
    id: number
    name: string
}

export type NewLabelPayload = {
    name: string
}
