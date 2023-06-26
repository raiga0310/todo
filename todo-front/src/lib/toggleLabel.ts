import { Label } from "../types/todo";

export const toggleLabel = (labels: Label[], target: Label) => 
    labels.find(({ id }) => id === target.id)
        ? labels.filter(({ id}) => id !== target.id)
        : [...labels, target];

