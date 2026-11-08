import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Heart,
  Trash2,
} from 'lucide-react'
import type {
  Ability,
  AptitudeId,
  AttrKey,
  Character,
  Condition,
  Die,
  InventoryItem,
  RollableSkill,
  SkillId,
} from '../types'
import { PROFILE_BY_ID } from '../data/profiles'
import { conditionStep, syncResourceTotals } from '../lib/character'
import { getCharacter } from '../lib/storage'
import { downloadJson, slugify } from '../lib/utils'
import { useCharacters } from '../context/characters'
import { useToast } from '../context/toast'
import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { Avatar } from '../components/character/Avatar'
import { Vitals } from '../components/character/Vitals'
import { ResourcePlanner } from '../components/character/ResourcePlanner'
import { AttributeList } from '../components/character/AttributeList'
import { SkillList } from '../components/character/SkillList'
import { ConditionList } from '../components/character/ConditionList'
import { AbilityList } from '../components/character/AbilityList'
import { InventoryList } from '../components/character/InventoryList'
import { NotesPanel } from '../components/character/NotesPanel'
import { RollDialog } from '../components/rolls/RollDialog'
import { RollHistory } from '../components/rolls/RollHistory'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

type TabId = 'skills' | 'abilities' | 'inventory' | 'description' | 'history'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'skills', label: 'Perícias' },
  { id: 'abilities', label: 'Habilidades' },
  { id: 'inventory', label: 'Inventário' },
  { id: 'description', label: 'Descrição' },
  { id: 'history', label: 'Histórico' },
]

export function SheetPage() {
  const { id } = useParams<{ id: string }>()
  return <SheetView key={id ?? 'sem-id'} id={id ?? ''} />
}

function SheetView({ id }: { id: string }) {
  const navigate = useNavigate()
  const { save, duplicate, remove } = useCharacters()
  const { notify } = useToast()

  const [character, setCharacter] = useState<Character | null>(() =>
    id ? (getCharacter(id) ?? null) : null,
  )
  const [tab, setTab] = useState<TabId>('skills')
  const [rolling, setRolling] = useState<RollableSkill | null>(null)
  const [rollVersion, setRollVersion] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const safeSave = useCallback(
    (next: Character) => {
      try {
        save(next)
      } catch {
        notify('Não foi possível salvar as alterações neste navegador.', 'danger')
      }
    },
    [save, notify],
  )

  const dirty = useDebouncedSave(character, safeSave)

  const penalties = useMemo<Record<AttrKey, number>>(() => {
    if (!character) return { fisico: 0, mente: 0, emocao: 0 }
    return {
      fisico: conditionStep(character, 'fisico'),
      mente: conditionStep(character, 'mente'),
      emocao: conditionStep(character, 'emocao'),
    }
  }, [character])

  if (!character) {
    return (
      <div className="container not-found">
        <span className="eyebrow">Registro não encontrado</span>
        <h1>404</h1>
        <p className="muted">Esta ficha não existe ou foi removida do arquivo.</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar ao arquivo
        </Link>
      </div>
    )
  }

  const profile = PROFILE_BY_ID[character.profile]
  const accent = profile?.accent ?? '#a347ff'

  const update = (patch: Partial<Character>) => {
    setCharacter((current) => (current ? { ...current, ...patch } : current))
  }

  const changeAttr = (attr: AttrKey, die: Die) => {
    setCharacter((current) =>
      current
        ? syncResourceTotals({
            ...current,
            attributes: { ...current.attributes, [attr]: die },
          })
        : current,
    )
  }

  const handleRollSave = (next: Character) => {
    setCharacter(next)
    safeSave(next)
    setRollVersion((current) => current + 1)
  }

  const handleExport = () => {
    downloadJson(character, `${slugify(character.name || 'ficha')}.json`)
    notify('Ficha exportada em JSON.', 'success')
  }

  const handleDuplicate = () => {
    try {
      const copy = duplicate(character)
      notify(`Cópia criada: ${copy.name}.`, 'success')
      navigate(`/ficha/${copy.id}`)
    } catch {
      notify('Não foi possível duplicar a ficha neste navegador.', 'danger')
    }
  }

  const handleDelete = () => {
    try {
      remove(character.id)
      notify('Ficha excluída.', 'info')
      navigate('/')
    } catch {
      notify('Não foi possível excluir a ficha.', 'danger')
    }
  }

  const addAbility = (ability: Ability) => {
    update({ abilities: [...character.abilities, ability] })
  }

  const removeAbility = (abilityId: string) => {
    update({ abilities: character.abilities.filter((ability) => ability.id !== abilityId) })
  }

  const setInventory = (inventory: InventoryItem[]) => update({ inventory })
  const setConditions = (conditions: Condition[]) => update({ conditions })

  return (
    <div className="container sheet-page">
      <div className="sheet-head" style={{ '--sheet-accent': accent } as CSSProperties}>
        <div className="sheet-head-main">
          <Avatar name={character.name} portrait={character.portrait} size="lg" />
          <div className="sheet-identity">
            <input
              className="sheet-name-input"
              value={character.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Nome do agente"
              aria-label="Nome do agente"
            />
            <div className="sheet-tags">
              <span className="badge badge-accent" style={{ color: accent, borderColor: accent }}>
                {profile?.name ?? 'Perfil'}
              </span>
              <span className="badge">{character.occupation}</span>
              <span className="badge">Nível {character.level}</span>
              {character.nex > 0 ? <span className="badge">NEX {character.nex}%</span> : null}
              {dirty ? (
                <span className="badge badge-warn">Salvando…</span>
              ) : (
                <span className="badge badge-ok">Salvo</span>
              )}
            </div>
          </div>
          <div className="sheet-head-actions">
            <Link to="/" className="btn btn-ghost btn-sm">
              <ArrowLeft size={14} aria-hidden="true" /> Arquivo
            </Link>
            <button
              type="button"
              className="icon-btn"
              onClick={handleExport}
              title="Exportar JSON"
              aria-label="Exportar ficha em JSON"
            >
              <Download aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={handleDuplicate}
              title="Duplicar ficha"
              aria-label="Duplicar ficha"
            >
              <Copy aria-hidden="true" />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              onClick={() => setConfirmDelete(true)}
              title="Excluir ficha"
              aria-label="Excluir ficha"
            >
              <Trash2 aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="sheet-summary">
        <Panel title="Atributos" icon={<Activity size={15} aria-hidden="true" />}>
          <AttributeList character={character} penalties={penalties} onChange={changeAttr} />
        </Panel>

        <Panel title="Recursos" icon={<Heart size={15} aria-hidden="true" />}>
          <Vitals character={character} onChange={update} />
          <div className="panel-divider" />
          <ResourcePlanner character={character} onChange={update} compact />
        </Panel>

        <Panel title="Condições" icon={<AlertTriangle size={15} aria-hidden="true" />}>
          <ConditionList character={character} onChange={setConditions} />
        </Panel>
      </div>

      <section className="panel sheet-tab-panel">
        <div className="panel-head sheet-tab-head">
          <span className="panel-title">
            <FileText size={15} aria-hidden="true" /> Ficha
          </span>
          <span className="small muted">Clique em uma perícia para rolar</span>
        </div>
        <div className="sheet-tabs" role="tablist" aria-label="Seções da ficha">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`sheet-tab${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {item.id === 'abilities' ? ` (${character.abilities.length})` : null}
              {item.id === 'inventory' ? ` (${character.inventory.length})` : null}
            </button>
          ))}
        </div>
        <div className="panel-body sheet-tab-body">
          {tab === 'skills' ? (
            <SkillList
              character={character}
              penalties={penalties}
              onSkillDie={(skillId: SkillId, die: Die) =>
                update({ skills: { ...character.skills, [skillId]: die } })
              }
              onAptitudeDie={(aptitudeId: AptitudeId, die: Die) =>
                update({ aptitudes: { ...character.aptitudes, [aptitudeId]: die } })
              }
              onRoll={setRolling}
            />
          ) : null}

          {tab === 'abilities' ? (
            <AbilityList
              abilities={character.abilities}
              onAdd={addAbility}
              onRemove={removeAbility}
            />
          ) : null}

          {tab === 'inventory' ? (
            <InventoryList items={character.inventory} onChange={setInventory} />
          ) : null}

          {tab === 'description' ? (
            <NotesPanel character={character} onChange={update} />
          ) : null}

          {tab === 'history' ? (
            <RollHistory
              characterId={character.id}
              reloadToken={rollVersion}
              onCleared={() => setRollVersion((current) => current + 1)}
            />
          ) : null}
        </div>
      </section>

      {rolling ? (
        <RollDialog
          character={character}
          skill={rolling}
          onClose={() => setRolling(null)}
          onSave={handleRollSave}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDialog
          title="Excluir ficha"
          message={`A ficha de “${character.name || 'Agente'}” e o histórico de rolagens serão apagados. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir ficha"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  )
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <span className="panel-title">
          {icon}
          {title}
        </span>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}
