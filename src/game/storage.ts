import type { TrainerDefinition } from '../domain/models.ts'

const CUSTOM_TRAINERS_KEY = 'savedCustomTrainers'

export function loadSavedCustomTrainers(): TrainerDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TRAINERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidTrainer)
  } catch {
    return []
  }
}

export function saveCustomTrainer(trainer: TrainerDefinition): TrainerDefinition[] {
  const current = loadSavedCustomTrainers()
  const existingIndex = current.findIndex((t) => t.id === trainer.id)
  if (existingIndex >= 0) {
    current[existingIndex] = trainer
  } else {
    current.push(trainer)
  }
  try {
    localStorage.setItem(CUSTOM_TRAINERS_KEY, JSON.stringify(current))
  } catch {}
  return current
}

export function deleteCustomTrainer(trainerId: string): TrainerDefinition[] {
  const current = loadSavedCustomTrainers()
  const updated = current.filter((t) => t.id !== trainerId)
  try {
    localStorage.setItem(CUSTOM_TRAINERS_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

function isValidTrainer(obj: any): obj is TrainerDefinition {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.roster)
  )
}
