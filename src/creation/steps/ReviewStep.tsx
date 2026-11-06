import type { Character } from '../../types'
import { APTITUDES, ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import { OCCUPATION_BY_ID } from '../../data/occupations'
import { PROFILES, PROFILE_BY_ID } from '../../data/profiles'
import { suggestResources } from '../../lib/character'
import { DieIcon } from '../../components/DieIcon'

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
  const suggested = suggestResources(character)
  const trained = SKILLS.filter((skill) => character.skills[skill.id] !== 'd4')
  const trainedAptitudes = APTITUDES.filter(
    (aptitude) => character.aptitudes[aptitude.id] !== 'd4',
  )

  const applySuggestion = () => {
    onChange({
      pv: { current: suggested.pvMax, max: suggested.pvMax },
      pd: { current: suggested.pdMax, max: suggested.pdMax },
    })
  }

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
        <div
          className="input-row"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}
        >
          <label className="field">
            <span>PV máximo</span>
            <input
              className="input"
              type="number"
              min={1}
              value={character.pv.max}
              onChange={(event) => {
                const max = Math.max(1, Number(event.target.value) || 1)
                onChange({ pv: { current: Math.min(character.pv.current, max), max } })
              }}
            />
          </label>
          <label className="field">
            <span>PD máximo</span>
            <input
              className="input"
              type="number"
              min={1}
              value={character.pd.max}
              onChange={(event) => {
                const max = Math.max(1, Number(event.target.value) || 1)
                onChange({ pd: { current: Math.min(character.pd.current, max), max } })
              }}
            />
          </label>
          <label className="field">
            <span>Nível</span>
            <input
              className="input"
              type="number"
              min={1}
              value={character.level}
              onChange={(event) =>
                onChange({ level: Math.max(1, Number(event.target.value) || 1) })
              }
            />
          </label>
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
        <div className="row-between" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <span className="small muted">
            Sugestão: {suggested.pvMax} PV e {suggested.pdMax} PD.
          </span>
          <button type="button" className="btn btn-sm" onClick={applySuggestion}>
            Recalcular sugestão
          </button>
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
