import type {
  AptitudeId,
  AttrKey,
  Character,
  Die,
  RollableSkill,
  SkillId,
} from '../../types'
import { APTITUDES, ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import { DieIcon } from '../DieIcon'
import { DieStep } from '../ui/DieStep'

interface SkillListProps {
  character: Character
  penalties: Record<AttrKey, number>
  onSkillDie: (id: SkillId, die: Die) => void
  onAptitudeDie: (id: AptitudeId, die: Die) => void
  onRoll: (skill: RollableSkill) => void
}

export function SkillList({
  character,
  penalties,
  onSkillDie,
  onAptitudeDie,
  onRoll,
}: SkillListProps) {
  return (
    <div>
      <div className="skill-groups">
        {ATTRIBUTES.map((attribute) => {
          const penalty = penalties[attribute.key] ?? 0
          return (
            <section key={attribute.key}>
              <h3 className="skill-group-head">
                <DieIcon die="d6" attr={attribute.key} size={15} />
                {ATTR_LABEL[attribute.key]}
                {penalty > 0 ? (
                  <span className="badge badge-danger">−{penalty} passo{penalty > 1 ? 's' : ''}</span>
                ) : null}
              </h3>
              <div className="skill-list">
                {SKILLS.filter((skill) => skill.attr === attribute.key).map((skill) => {
                  const die = character.skills[skill.id]
                  return (
                    <div className="skill-item" key={skill.id}>
                      <button
                        type="button"
                        className="skill-roll"
                        title={`${skill.description} (${die})`}
                        onClick={() =>
                          onRoll({
                            id: skill.id,
                            name: skill.name,
                            attr: skill.attr,
                            die,
                            kind: 'skill',
                          })
                        }
                      >
                        <DieIcon die={die} attr={skill.attr} size={22} />
                        <span className="skill-roll-name">
                          {skill.name}
                          <small>{die}</small>
                        </span>
                      </button>
                      <DieStep
                        die={die}
                        label={skill.name}
                        onChange={(next) => onSkillDie(skill.id, next)}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="aptitude-box">
        <h3 className="skill-group-head">
          <DieIcon die="d6" attr="mente" size={15} />
          Aptidões
          {(penalties.mente ?? 0) > 0 ? (
            <span className="badge badge-danger">
              Mente −{penalties.mente} passo{penalties.mente > 1 ? 's' : ''}
            </span>
          ) : null}
          <span className="badge">fora do orçamento</span>
        </h3>
        <div className="skill-list">
          {APTITUDES.map((aptitude) => {
            const die = character.aptitudes[aptitude.id]
            return (
              <div className="skill-item" key={aptitude.id}>
                <button
                  type="button"
                  className="skill-roll"
                  title={`${aptitude.description} (${die})`}
                  onClick={() =>
                    onRoll({
                      id: `aptidao-${aptitude.id}`,
                      name: `Aptidão (${aptitude.name})`,
                      attr: 'mente',
                      die,
                      kind: 'aptitude',
                    })
                  }
                >
                  <DieIcon die={die} attr="mente" size={22} />
                  <span className="skill-roll-name">
                    {aptitude.name}
                    <small>{`Aptidão · ${die}`}</small>
                  </span>
                </button>
                <DieStep
                  die={die}
                  label={aptitude.name}
                  onChange={(next) => onAptitudeDie(aptitude.id, next)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
