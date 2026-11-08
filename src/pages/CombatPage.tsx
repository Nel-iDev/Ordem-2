import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  ExternalLink,
  Flag,
  Heart,
  Minus,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Square,
  Swords,
  Trash2,
  UserPlus,
  Zap,
} from 'lucide-react'
import type { Character, Combatant, CombatEncounter } from '../types'
import { PROFILE_BY_ID } from '../data/profiles'
import {
  PRONTIDAO_COST,
  activateProntidao,
  clearSceneEffects,
  hasMechanic,
} from '../lib/abilities'
import {
  addCombatant,
  combatantName,
  createCharacterCombatant,
  createEncounter,
  createNpcCombatant,
  endEncounter,
  hasActiveProntidao,
  initiativeOrder,
  linkedCharacter,
  nextTurn,
  patchCombatant,
  removeCombatant,
  startEncounter,
  type CombatantPatch,
} from '../lib/combat'
import { deleteEncounter, loadEncounters, upsertEncounter } from '../lib/storage'
import { clamp } from '../lib/utils'
import { useCharacters } from '../context/characters'
import { useToast } from '../context/toast'
import { ConditionList } from '../components/character/ConditionList'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

function parseNumber(value: string, fallback: number): number {
  if (!value.trim()) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback
}

export function CombatPage() {
  const { characters, save } = useCharacters()
  const { notify } = useToast()
  const [encounters, setEncounters] = useState<CombatEncounter[]>(() => loadEncounters())
  const [selectedId, setSelectedId] = useState(() => encounters[0]?.id ?? '')
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [npcName, setNpcName] = useState('')
  const [npcPv, setNpcPv] = useState(10)
  const [npcPd, setNpcPd] = useState(10)
  const [npcInitiative, setNpcInitiative] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const encounter = useMemo(
    () => encounters.find((entry) => entry.id === selectedId) ?? encounters[0] ?? null,
    [encounters, selectedId],
  )

  const order = useMemo(
    () => (encounter ? initiativeOrder(encounter, characters) : []),
    [encounter, characters],
  )

  const current = useMemo(
    () =>
      encounter
        ? order.find((combatant) => combatant.id === encounter.currentId)
        : undefined,
    [encounter, order],
  )

  const availableCharacters = useMemo(
    () =>
      encounter
        ? characters.filter(
            (character) =>
              !encounter.combatants.some(
                (combatant) =>
                  combatant.kind === 'character' &&
                  combatant.characterId === character.id,
              ),
          )
        : [],
    [characters, encounter],
  )

  const characterToAdd = availableCharacters.find(
    (character) => character.id === selectedCharacterId,
  )

  const persist = (next: CombatEncounter) => {
    try {
      upsertEncounter(next)
      setEncounters(loadEncounters())
      setSelectedId(next.id)
    } catch {
      notify('Não foi possível salvar a cena neste navegador.', 'danger')
    }
  }

  const saveCharacter = (next: Character) => {
    try {
      save(next)
    } catch {
      notify('Não foi possível salvar a ficha neste navegador.', 'danger')
    }
  }

  const createNewEncounter = () => {
    const created = createEncounter()
    try {
      upsertEncounter(created)
      setEncounters(loadEncounters())
      setSelectedId(created.id)
      notify('Nova cena de combate criada.', 'success')
    } catch {
      notify('Não foi possível criar a cena neste navegador.', 'danger')
    }
  }

  const removeSelectedEncounter = () => {
    if (!encounter) return
    try {
      deleteEncounter(encounter.id)
      const next = loadEncounters()
      setEncounters(next)
      setSelectedId(next[0]?.id ?? '')
      setConfirmDelete(false)
      notify('Cena de combate excluída.', 'info')
    } catch {
      notify('Não foi possível excluir a cena.', 'danger')
    }
  }

  const updateEncounter = (patch: Partial<CombatEncounter>) => {
    if (!encounter) return
    persist({ ...encounter, ...patch })
  }

  const updateCombatant = (id: string, patch: CombatantPatch) => {
    if (!encounter) return
    persist(patchCombatant(encounter, id, patch))
  }

  const handleRemoveCombatant = (id: string) => {
    if (!encounter) return
    const next = removeCombatant(encounter, id)
    persist(
      encounter.active && encounter.currentId === id
        ? nextTurn(next, characters)
        : next,
    )
  }

  const handleStart = () => {
    if (!encounter) return
    persist(startEncounter(encounter, characters))
    notify('Combate iniciado.', 'success')
  }

  const handleNext = () => {
    if (!encounter) return
    persist(nextTurn(encounter, characters))
  }

  const handleEnd = () => {
    if (!encounter) return
    const linked = encounter.combatants
      .map((combatant) => linkedCharacter(combatant, characters))
      .filter((character): character is Character => Boolean(character))

    for (const character of linked) {
      if (
        character.abilityState.prontidaoUsed ||
        character.abilityState.impetoAttrBuff
      ) {
        saveCharacter(clearSceneEffects(character))
      }
    }

    persist(endEncounter(encounter))
    setConfirmEnd(false)
    notify('Combate encerrado. Efeitos de cena foram limpos.', 'info')
  }

  const handleProntidao = (character: Character) => {
    try {
      save(activateProntidao(character))
      notify(
        `${character.name.trim() || 'Agente'} ativou Prontidão e agirá antes de todos.`,
        'success',
      )
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Não foi possível ativar Prontidão.',
        'danger',
      )
    }
  }

  const handleAddCharacter = () => {
    if (!encounter || !characterToAdd) return
    persist(addCombatant(encounter, createCharacterCombatant(characterToAdd)))
    setSelectedCharacterId('')
    notify(
      `${characterToAdd.name.trim() || 'Agente'} entrou na cena.`,
      'success',
    )
  }

  const handleAddNpc = (event: FormEvent) => {
    event.preventDefault()
    if (!encounter) return
    if (!npcName.trim()) {
      notify('Dê um nome ao NPC.', 'danger')
      return
    }
    persist(
      addCombatant(
        encounter,
        createNpcCombatant({
          name: npcName,
          pvMax: npcPv,
          pdMax: npcPd,
          initiative: npcInitiative,
        }),
      ),
    )
    setNpcName('')
    setNpcPv(10)
    setNpcPd(10)
    setNpcInitiative(0)
    notify('NPC adicionado à cena.', 'success')
  }

  return (
    <div className="container combat-page">
      <section className="page-head">
        <div>
          <span className="eyebrow">Ordem 2 · mesa de combate</span>
          <h1 className="page-title">
            Iniciativa & <span className="accent">conflito</span>
          </h1>
          <p className="page-sub">
            Organize turnos, acompanhe PV/PD e aplique condições. A iniciativa é
            informada pela mesa: o material atual não define uma rolagem própria.
          </p>
        </div>
        <div className="toolbar">
          {encounters.length ? (
            <select
              className="select"
              style={{ width: 'auto', minWidth: 190 }}
              value={encounter?.id ?? ''}
              onChange={(event) => setSelectedId(event.target.value)}
              aria-label="Selecionar cena de combate"
            >
              {encounters.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name || 'Nova cena'}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={createNewEncounter}>
            <Plus size={15} aria-hidden="true" /> Nova cena
          </button>
          {encounter ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={15} aria-hidden="true" /> Excluir
            </button>
          ) : null}
        </div>
      </section>

      {!encounter ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Swords aria-hidden="true" />
          </div>
          <h2>Nenhuma cena de combate</h2>
          <p>
            Crie uma cena para ordenar a iniciativa, acompanhar PV/PD e aplicar
            condições nos participantes.
          </p>
          <button type="button" className="btn btn-primary" onClick={createNewEncounter}>
            <Plus size={16} aria-hidden="true" /> Criar primeira cena
          </button>
        </div>
      ) : (
        <div className="combat-layout">
          <section className="panel">
            <div className="panel-head combat-panel-head">
              <div className="combat-title-row">
                <input
                  className="input combat-name-input"
                  value={encounter.name}
                  onChange={(event) => updateEncounter({ name: event.target.value })}
                  aria-label="Nome da cena"
                />
                <span
                  className={`badge ${encounter.active ? 'badge-ok' : 'badge-accent'}`}
                >
                  {encounter.active ? 'Em andamento' : 'Preparada'}
                </span>
              </div>
              <div className="toolbar">
                {encounter.active ? (
                  <>
                    <button type="button" className="btn" onClick={handleNext}>
                      <SkipForward size={15} aria-hidden="true" /> Próximo turno
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setConfirmEnd(true)}
                    >
                      <Square size={14} aria-hidden="true" /> Encerrar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStart}
                    disabled={
                      !encounter.combatants.some((combatant) => !combatant.defeated)
                    }
                  >
                    <Play size={15} aria-hidden="true" /> Iniciar combate
                  </button>
                )}
              </div>
            </div>

            <div className="panel-body">
              <div className="combat-status">
                <span className="combat-round">
                  Rodada <strong>{encounter.round}</strong>
                </span>
                <span
                  className={`badge ${
                    encounter.phase === 'prontidao' ? 'badge-warn' : 'badge-accent'
                  }`}
                >
                  {encounter.phase === 'prontidao' ? 'Prontidão' : 'Ordem normal'}
                </span>
                {encounter.active && current ? (
                  <span>
                    Turno de{' '}
                    <strong>{combatantName(current, characters)}</strong>
                  </span>
                ) : (
                  <span className="muted">
                    {encounter.active
                      ? 'Nenhum participante ativo'
                      : 'Aguardando início'}
                  </span>
                )}
              </div>

              {encounter.active && encounter.phase === 'prontidao' ? (
                <p className="combat-phase-note">
                  Rodada de Prontidão: quem ativou a habilidade age uma vez antes
                  da ordem normal.
                </p>
              ) : null}

              {order.length ? (
                <div className="combat-list">
                  {order.map((combatant, index) => {
                    const character = linkedCharacter(combatant, characters)
                    const canActivateProntidao = Boolean(
                      character &&
                        !encounter.active &&
                        hasMechanic(character, 'prontidao') &&
                        !character.abilityState.prontidaoUsed &&
                        character.pd.current >= PRONTIDAO_COST,
                    )
                    return (
                      <CombatantCard
                        key={combatant.id}
                        combatant={combatant}
                        order={index + 1}
                        character={character}
                        active={encounter.active}
                        current={
                          encounter.active && encounter.currentId === combatant.id
                        }
                        prontidao={hasActiveProntidao(combatant, characters)}
                        prontidaoPhase={
                          encounter.active &&
                          encounter.phase === 'prontidao' &&
                          encounter.prontidaoIds.includes(combatant.id)
                        }
                        canActivateProntidao={canActivateProntidao}
                        onPatch={(patch) => updateCombatant(combatant.id, patch)}
                        onRemove={() => handleRemoveCombatant(combatant.id)}
                        onSaveCharacter={saveCharacter}
                        onProntidao={handleProntidao}
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="small muted combat-empty">
                  Nenhum participante na cena. Adicione um agente do arquivo ou um
                  NPC.
                </p>
              )}
            </div>
          </section>

          <aside className="combat-side">
            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <UserPlus size={15} aria-hidden="true" /> Adicionar agente
                </span>
              </div>
              <div className="panel-body">
                {availableCharacters.length ? (
                  <div className="stack-sm">
                    <select
                      className="select"
                      value={characterToAdd?.id ?? ''}
                      onChange={(event) =>
                        setSelectedCharacterId(event.target.value)
                      }
                      aria-label="Agente para adicionar"
                    >
                      <option value="">Selecione um agente…</option>
                      {availableCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name.trim() || 'Agente sem nome'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!characterToAdd}
                      onClick={handleAddCharacter}
                    >
                      <Plus size={14} aria-hidden="true" /> Adicionar à cena
                    </button>
                  </div>
                ) : (
                  <p className="small muted">
                    {characters.length
                      ? 'Todos os agentes do arquivo já estão nesta cena.'
                      : 'Nenhum agente no arquivo. Crie uma ficha primeiro.'}
                  </p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <Swords size={15} aria-hidden="true" /> Adicionar NPC
                </span>
              </div>
              <div className="panel-body">
                <form className="stack-sm" onSubmit={handleAddNpc}>
                  <label className="field">
                    <span>Nome</span>
                    <input
                      className="input"
                      value={npcName}
                      onChange={(event) => setNpcName(event.target.value)}
                      placeholder="Criatura, capanga…"
                      required
                    />
                  </label>
                  <div className="combat-form-grid">
                    <label className="field">
                      <span>PV</span>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={999}
                        value={npcPv}
                        onChange={(event) =>
                          setNpcPv(parseNumber(event.target.value, npcPv))
                        }
                      />
                    </label>
                    <label className="field">
                      <span>PD</span>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        max={999}
                        value={npcPd}
                        onChange={(event) =>
                          setNpcPd(parseNumber(event.target.value, npcPd))
                        }
                      />
                    </label>
                  </div>
                  <label className="field">
                    <span>Iniciativa</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={99}
                      value={npcInitiative}
                      onChange={(event) =>
                        setNpcInitiative(
                          parseNumber(event.target.value, npcInitiative),
                        )
                      }
                    />
                  </label>
                  <button type="submit" className="btn btn-sm">
                    <Plus size={14} aria-hidden="true" /> Adicionar NPC
                  </button>
                </form>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">
                  <Zap size={15} aria-hidden="true" /> Como funciona
                </span>
              </div>
              <div className="panel-body">
                <ul className="combat-help">
                  <li>
                    A iniciativa é digitada pela mesa; o livro não define uma
                    rolagem própria.
                  </li>
                  <li>
                    Prontidão ativa coloca o agente numa rodada extra antes de
                    todos.
                  </li>
                  <li>
                    Encerrar o combate limpa Prontidão e bônus de Ímpeto dos
                    agentes participantes.
                  </li>
                  <li>
                    Condições e PV/PD são gravados direto na ficha do agente.
                  </li>
                </ul>
              </div>
            </section>
          </aside>
        </div>
      )}

      {confirmDelete && encounter ? (
        <ConfirmDialog
          title="Excluir cena de combate"
          message={`A cena “${encounter.name}” será removida. As fichas dos agentes não serão alteradas.`}
          confirmLabel="Excluir cena"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={removeSelectedEncounter}
        />
      ) : null}

      {confirmEnd && encounter ? (
        <ConfirmDialog
          title="Encerrar combate"
          message="Encerrar a cena limpa Prontidão e bônus de Ímpeto dos agentes participantes. PV, PD e condições permanecem nas fichas."
          confirmLabel="Encerrar combate"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={handleEnd}
        />
      ) : null}
    </div>
  )
}

interface CombatantCardProps {
  combatant: Combatant
  order: number
  character?: Character
  active: boolean
  current: boolean
  prontidao: boolean
  prontidaoPhase: boolean
  canActivateProntidao: boolean
  onPatch: (patch: CombatantPatch) => void
  onRemove: () => void
  onSaveCharacter: (character: Character) => void
  onProntidao: (character: Character) => void
}

function CombatantCard({
  combatant,
  order,
  character,
  active,
  current,
  prontidao,
  prontidaoPhase,
  canActivateProntidao,
  onPatch,
  onRemove,
  onSaveCharacter,
  onProntidao,
}: CombatantCardProps) {
  const profile = character ? PROFILE_BY_ID[character.profile] : undefined
  const name =
    character?.name.trim() ||
    combatant.name ||
    (combatant.kind === 'npc' ? 'NPC' : 'Agente')
  const showImpeto = character ? hasMechanic(character, 'impeto') : false

  return (
    <article
      className={`combatant-card${current ? ' current' : ''}${
        combatant.defeated ? ' defeated' : ''
      }${prontidaoPhase ? ' prontidao-phase' : ''}`}
    >
      <div className="combatant-order" aria-hidden="true">
        {order}
      </div>

      <div className="combatant-body">
        <div className="combatant-head">
          <div className="combatant-name-row">
            {combatant.kind === 'npc' ? (
              <input
                className="input combatant-name-input"
                value={combatant.name}
                onChange={(event) => onPatch({ name: event.target.value })}
                aria-label="Nome do NPC"
              />
            ) : (
              <strong className="combatant-name">{name}</strong>
            )}

            {character ? (
              <span
                className="badge badge-accent"
                style={{ color: profile?.accent, borderColor: profile?.accent }}
              >
                {profile?.name ?? 'Agente'}
              </span>
            ) : combatant.kind === 'npc' ? (
              <span className="badge">NPC</span>
            ) : (
              <span className="badge badge-danger">Ficha removida</span>
            )}

            {current ? <span className="badge badge-ok">Turno atual</span> : null}
            {combatant.defeated ? (
              <span className="badge badge-danger">Fora de combate</span>
            ) : null}
            {prontidao ? (
              <span className="badge badge-warn">Prontidão ativa</span>
            ) : null}
            {showImpeto && character ? (
              <span className="badge">
                <Zap size={11} aria-hidden="true" /> Ímpeto{' '}
                {character.impeto.filled}/{character.impeto.max}
              </span>
            ) : null}
          </div>

          <div className="combatant-actions">
            {character ? (
              <Link
                to={`/ficha/${character.id}`}
                className="icon-btn"
                title="Abrir ficha"
                aria-label={`Abrir ficha de ${name}`}
              >
                <ExternalLink aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="button"
              className="icon-btn"
              title={
                combatant.defeated
                  ? 'Reintegrar ao combate'
                  : 'Marcar como fora de combate'
              }
              aria-label={
                combatant.defeated
                  ? `Reintegrar ${name} ao combate`
                  : `Marcar ${name} como fora de combate`
              }
              onClick={() => onPatch({ defeated: !combatant.defeated })}
            >
              {combatant.defeated ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <Flag aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="icon-btn danger"
              title="Remover da cena"
              aria-label={`Remover ${name} da cena`}
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="combatant-meta">
          <label className="combat-initiative">
            <span>Iniciativa</span>
            <input
              className="input"
              type="number"
              min={0}
              max={99}
              value={combatant.initiative}
              onChange={(event) =>
                onPatch({
                  initiative: parseNumber(
                    event.target.value,
                    combatant.initiative,
                  ),
                })
              }
              aria-label={`Iniciativa de ${name}`}
            />
          </label>

          {character ? (
            <div className="combat-vitals">
              <VitalControl
                label="PV"
                icon={<Heart size={12} aria-hidden="true" />}
                current={character.pv.current}
                max={character.pv.max}
                onCurrent={(current) =>
                  onSaveCharacter({
                    ...character,
                    pv: { ...character.pv, current },
                  })
                }
              />
              <VitalControl
                label="PD"
                icon={<Brain size={12} aria-hidden="true" />}
                current={character.pd.current}
                max={character.pd.max}
                onCurrent={(current) =>
                  onSaveCharacter({
                    ...character,
                    pd: { ...character.pd, current },
                  })
                }
              />
            </div>
          ) : combatant.kind === 'npc' ? (
            <div className="combat-vitals">
              <VitalControl
                label="PV"
                icon={<Heart size={12} aria-hidden="true" />}
                current={combatant.pv.current}
                max={combatant.pv.max}
                onCurrent={(current) => onPatch({ pv: { current } })}
                onMax={(max) => onPatch({ pv: { max } })}
              />
              <VitalControl
                label="PD"
                icon={<Brain size={12} aria-hidden="true" />}
                current={combatant.pd.current}
                max={combatant.pd.max}
                onCurrent={(current) => onPatch({ pd: { current } })}
                onMax={(max) => onPatch({ pd: { max } })}
              />
            </div>
          ) : null}
        </div>

        {character ? (
          <details className="combat-conditions">
            <summary>Condições ({character.conditions.length})</summary>
            <ConditionList
              character={character}
              onChange={(conditions) =>
                onSaveCharacter({ ...character, conditions })
              }
            />
          </details>
        ) : null}

        {character && hasMechanic(character, 'prontidao') ? (
          <div className="combatant-prontidao">
            {character.abilityState.prontidaoUsed ? (
              <span className="badge badge-warn">
                Prontidão já ativa nesta cena
              </span>
            ) : canActivateProntidao ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onProntidao(character)}
              >
                <Play size={13} aria-hidden="true" /> Ativar Prontidão (
                {PRONTIDAO_COST} PD)
              </button>
            ) : active ? (
              <span className="small muted">
                Prontidão só pode ser ativada antes de iniciar o combate.
              </span>
            ) : (
              <span className="small muted">
                PD insuficiente para Prontidão ({PRONTIDAO_COST} PD).
              </span>
            )}
          </div>
        ) : null}
      </div>
    </article>
  )
}

interface VitalControlProps {
  label: string
  icon: ReactNode
  current: number
  max: number
  onCurrent: (value: number) => void
  onMax?: (value: number) => void
}

function VitalControl({
  label,
  icon,
  current,
  max,
  onCurrent,
  onMax,
}: VitalControlProps) {
  return (
    <div className="combat-vital">
      <span className="combat-vital-label">
        {icon}
        {label}
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => onCurrent(clamp(current - 1, 0, max))}
        aria-label={`Diminuir ${label}`}
      >
        <Minus aria-hidden="true" />
      </button>
      <input
        className="input combat-vital-input"
        type="number"
        min={0}
        max={max}
        value={current}
        onChange={(event) =>
          onCurrent(clamp(parseNumber(event.target.value, current), 0, max))
        }
        aria-label={`${label} atual`}
      />
      <span className="combat-vital-sep">/</span>
      {onMax ? (
        <input
          className="input combat-vital-input combat-vital-max-input"
          type="number"
          min={1}
          max={999}
          value={max}
          onChange={(event) =>
            onMax(Math.max(1, parseNumber(event.target.value, max)))
          }
          aria-label={`${label} máximo`}
        />
      ) : (
        <span className="combat-vital-max">{max}</span>
      )}
      <button
        type="button"
        className="icon-btn"
        onClick={() => onCurrent(clamp(current + 1, 0, max))}
        aria-label={`Aumentar ${label}`}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  )
}
