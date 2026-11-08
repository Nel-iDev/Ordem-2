import type { Character } from '../../types'
import { APTITUDES, ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import { OCCUPATION_BY_ID } from '../../data/occupations'
import { PROFILES, PROFILE_BY_ID } from '../../data/profiles'
import { DieIcon } from '../../components/DieIcon'
import { ResourcePlanner } from '../../components/character/ResourcePlanner'

interface ReviewStepProps {
  character: Character
  errors: string[]
  freeMode: boolean
  onToggleFreeMode: (value: boolean) => void
  onChange: (patch: Partial<Character>) => void
}

export function ReviewStep({
  character,
  errors,
  freeMode,
  onToggleFreeMode,
  onChange,
}: ReviewStepProps) {
  const profile = PROFILE_BY_ID[character.profile] ?? PROFILES[0]
  const occupation = OCCUPATION_BY_ID[character.occupationId]
  const trained = SKILLS.filter((skill) => character.skills[skill.id] !== 'd4')
  const trainedAptitudes = APTITUDES.filter(
    (aptitude) => character.aptitudes[aptitude.id] !== 'd4',
  )

  return (
    <div className="stack">
      <div className="review-grid">
        <div className="review-block">
          <h3>Identidade</h3>
          <div className="review-list">
            <div className="row-between">
              <span>Nome</span>
              <strong>{character.name || '—'}</strong>
            </div>
            <div className="row-between">
              <span>Idade</span>
              <strong>{character.age || '—'}</strong>
            </div>
            <div className="row-between">
              <span>Conceito</span>
              <strong>{character.concept || '—'}</strong>
            </div>
          </div>
        </div>

        <div className="review-block">
          <h3>Perfil & ocupação</h3>
          <div className="review-list">
            <div className="row-between">
              <span>Perfil</span>
              <strong style={{ color: profile.accent }}>{profile.name}</strong>
            </div>
            <div className="row-between">
              <span>Ocupação</span>
              <strong>{occupation?.name ?? character.occupation}</strong>
            </div>
            <div className="row-between">
              <span>Habilidades</span>
              <strong style={{ textAlign: 'right' }}>
                {profile.ability.name} · {occupation?.ability.name ?? 'Custom'}
              </strong>
            </div>
          </div>
        </div>

        <div className="review-block">
          <h3>Atributos</h3>
          <div className="review-list">
            {ATTRIBUTES.map((attribute) => (
              <div className="row-between" key={attribute.key}>
                <span>{ATTR_LABEL[attribute.key]}</span>
                <strong className="row" style={{ gap: 6 }}>
                  <DieIcon
                    die={character.attributes[attribute.key]}
                    attr={attribute.key}
                    size={16}
                  />
                  {character.attributes[attribute.key]}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="review-block">
          <h3>Perícias treinadas</h3>
          <div className="review-list">
            {trained.length || trainedAptitudes.length ? (
              <>
                {trained.map((skill) => (
                  <div className="row-between" key={skill.id}>
                    <span>{skill.name}</span>
                    <strong className="mono">{character.skills[skill.id]}</strong>
                  </div>
                ))}
                {trainedAptitudes.map((aptitude) => (
                  <div className="row-between" key={aptitude.id}>
                    <span>Aptidão ({aptitude.name})</span>
                    <strong className="mono">{character.aptitudes[aptitude.id]}</strong>
                  </div>
                ))}
              </>
            ) : (
              <span>Todas as perícias em d4.</span>
            )}
          </div>
        </div>
      </div>

      <div className="review-block">
        <h3>Recursos & nível</h3>
        <ResourcePlanner character={character} onChange={onChange} />
        <div className="review-nex">
          <label className="field">
            <span>NEX</span>
            <input
              className="input"
              type="number"
              min={0}
              value={character.nex}
              onChange={(event) => onChange({ nex: Math.max(0, Number(event.target.value) || 0) })}
            />
          </label>
        </div>
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={freeMode}
          onChange={(event) => onToggleFreeMode(event.target.checked)}
        />
        Modo livre — ignorar os limites de 8 passos de atributo e perícia
      </label>

      {errors.length ? (
        <div className="error-list">
          Corrija antes de salvar:
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
