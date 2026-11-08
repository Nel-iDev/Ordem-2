import { describe, expect, it } from 'vitest'
import type { Character, CombatEncounter } from '../types'
import { activateProntidao } from './abilities'
import { createEmptyCharacter } from './character'
import {
  addCombatant,
  combatantName,
  createCharacterCombatant,
  createEncounter,
  createNpcCombatant,
  endEncounter,
  initiativeOrder,
  nextTurn,
  normalizeEncounter,
  patchCombatant,
  removeCombatant,
  startEncounter,
} from './combat'

function vigilante(): Character {
  return activateProntidao(
    createEmptyCharacter({
      name: 'Vera',
      profile: 'vigilante',
      pd: { current: 6, max: 6 },
    }),
  )
}

function executor(): Character {
  return createEmptyCharacter({ name: 'Edu', profile: 'executor' })
}

describe('mesa de combate', () => {
  it('cria uma cena vazia e normaliza dados inválidos', () => {
    const encounter = createEncounter()
    expect(encounter.round).toBe(1)
    expect(encounter.phase).toBe('normal')
    expect(encounter.active).toBe(false)
    expect(encounter.combatants).toEqual([])

    const normalized = normalizeEncounter({
      id: 'cena-1',
      name: '   ',
      round: 0,
      phase: 'invalida' as never,
      currentId: 'sumiu',
      prontidaoIds: ['npc-1', 'sumiu', 'npc-1'],
      combatants: [
        { id: 'npc-1', kind: 'npc', name: 'Capanga', initiative: 200, pv: { current: 99, max: 4 }, pd: { current: -3, max: 0 } },
        { id: 'quebrado', kind: 'character' },
        { id: 'npc-2', kind: 'npc', name: 'Sem iniciativa', initiative: -5 },
      ],
    } as unknown as Partial<CombatEncounter>)

    expect(normalized.name).toBe('Novo combate')
    expect(normalized.round).toBe(1)
    expect(normalized.phase).toBe('normal')
    expect(normalized.currentId).toBeNull()
    expect(normalized.prontidaoIds).toEqual(['npc-1'])
    expect(normalized.combatants).toHaveLength(2)

    const npc = normalized.combatants[0]
    expect(npc.kind).toBe('npc')
    if (npc.kind === 'npc') {
      expect(npc.initiative).toBe(99)
      expect(npc.pv).toEqual({ current: 4, max: 4 })
      expect(npc.pd).toEqual({ current: 0, max: 1 })
    }

    const other = normalized.combatants[1]
    expect(other.kind).toBe('npc')
    if (other.kind === 'npc') {
      expect(other.initiative).toBe(0)
      expect(other.pv).toEqual({ current: 10, max: 10 })
    }
  })

  it('ordena por iniciativa e coloca Prontidão à frente só na rodada extra', () => {
    const vera = vigilante()
    const edu = executor()
    const veraCombatant = {
      ...createCharacterCombatant(vera),
      name: 'Vera',
      initiative: 1,
    }
    const eduCombatant = {
      ...createCharacterCombatant(edu),
      name: 'Edu',
      initiative: 10,
    }
    const npc = {
      ...createNpcCombatant({ name: 'Capanga', pvMax: 6, pdMax: 6, initiative: 5 }),
    }

    const prepared = addCombatant(
      addCombatant(addCombatant(createEncounter(), veraCombatant), eduCombatant),
      npc,
    )

    expect(
      initiativeOrder(prepared, [vera, edu]).map((combatant) =>
        combatantName(combatant, [vera, edu]),
      ),
    ).toEqual(['Vera', 'Edu', 'Capanga'])

    const started = startEncounter(prepared, [vera, edu])
    expect(started.phase).toBe('prontidao')
    expect(started.prontidaoIds).toEqual([veraCombatant.id])
    expect(started.currentId).toBe(veraCombatant.id)

    const normal = nextTurn(started, [vera, edu])
    expect(normal.phase).toBe('normal')
    expect(normal.round).toBe(1)
    expect(normal.currentId).toBe(eduCombatant.id)
    expect(
      initiativeOrder(normal, [vera, edu]).map((combatant) => combatant.id),
    ).toEqual([eduCombatant.id, npc.id, veraCombatant.id])
  })

  it('avança turnos, pula derrotados e incrementa a rodada ao fechar a lista', () => {
    const edu = executor()
    const npc = createNpcCombatant({
      name: 'Capanga',
      pvMax: 6,
      pdMax: 6,
      initiative: 5,
    })
    const eduCombatant = {
      ...createCharacterCombatant(edu),
      name: 'Edu',
      initiative: 10,
    }

    let encounter = addCombatant(
      addCombatant(createEncounter(), eduCombatant),
      npc,
    )
    encounter = startEncounter(encounter, [edu])
    expect(encounter.currentId).toBe(eduCombatant.id)

    encounter = nextTurn(encounter, [edu])
    expect(encounter.currentId).toBe(npc.id)
    expect(encounter.round).toBe(1)

    encounter = nextTurn(encounter, [edu])
    expect(encounter.currentId).toBe(eduCombatant.id)
    expect(encounter.round).toBe(2)

    encounter = patchCombatant(encounter, eduCombatant.id, { defeated: true })
    encounter = nextTurn(encounter, [edu])
    expect(encounter.currentId).toBe(npc.id)
    expect(encounter.round).toBe(2)
  })

  it('não repete a rodada de Prontidão quando o participante atual cai', () => {
    const vera = activateProntidao(
      createEmptyCharacter({ name: 'Vera', profile: 'vigilante' }),
    )
    const vito = activateProntidao(
      createEmptyCharacter({ name: 'Vito', profile: 'vigilante' }),
    )
    const edu = executor()

    const veraCombatant = {
      ...createCharacterCombatant(vera),
      name: 'Vera',
      initiative: 1,
    }
    const vitoCombatant = {
      ...createCharacterCombatant(vito),
      name: 'Vito',
      initiative: 9,
    }
    const eduCombatant = {
      ...createCharacterCombatant(edu),
      name: 'Edu',
      initiative: 5,
    }

    let encounter = addCombatant(
      addCombatant(
        addCombatant(createEncounter(), veraCombatant),
        vitoCombatant,
      ),
      eduCombatant,
    )
    encounter = startEncounter(encounter, [vera, vito, edu])
    expect(encounter.currentId).toBe(vitoCombatant.id)

    encounter = patchCombatant(encounter, vitoCombatant.id, { defeated: true })
    encounter = nextTurn(encounter, [vera, vito, edu])
    expect(encounter.currentId).toBe(veraCombatant.id)
    expect(encounter.phase).toBe('prontidao')

    encounter = patchCombatant(encounter, veraCombatant.id, { defeated: true })
    encounter = nextTurn(encounter, [vera, vito, edu])
    expect(encounter.phase).toBe('normal')
    expect(encounter.round).toBe(1)
    expect(encounter.currentId).toBe(eduCombatant.id)
  })

  it('atualiza PV/PD de NPCs, remove participantes e encerra a cena', () => {
    const npc = createNpcCombatant({
      name: 'Capanga',
      pvMax: 6,
      pdMax: 4,
      initiative: 5,
    })
    let encounter = addCombatant(createEncounter(), npc)
    encounter = startEncounter(encounter, [])

    encounter = patchCombatant(encounter, npc.id, {
      pv: { current: 99 },
      pd: { current: 2, max: 3 },
    })

    const updated = encounter.combatants[0]
    expect(updated.kind).toBe('npc')
    if (updated.kind === 'npc') {
      expect(updated.pv).toEqual({ current: 6, max: 6 })
      expect(updated.pd).toEqual({ current: 2, max: 3 })
    }

    encounter = removeCombatant(encounter, npc.id)
    expect(encounter.combatants).toEqual([])
    expect(encounter.currentId).toBeNull()

    encounter = endEncounter({ ...encounter, active: true, phase: 'prontidao' })
    expect(encounter.active).toBe(false)
    expect(encounter.phase).toBe('normal')
    expect(encounter.prontidaoIds).toEqual([])
  })
})
