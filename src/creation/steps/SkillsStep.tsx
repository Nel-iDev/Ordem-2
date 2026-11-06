import type { AptitudeId, Character, Die, SkillId } from '../../types'
import { APTITUDES, ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import { SKILL_BUDGET, skillSpent } from '../../lib/character'
import { DieIcon } from '../../components/DieIcon'
import { DieStep } from '../../components/ui/DieStep'

interface SkillsStepProps {
  character: Character
  onChangeSkill: (id: SkillId, die: Die) => void
  onChangeAptitude: (id: AptitudeId, die: Die) => void
}

export function SkillsStep({ character, onChangeSkill, onChangeAptitude }: SkillsStepProps) {
  const spent = skillSpent(character)
  const over = spent > SKILL_BUDGET
  const percent = Math.min(100, (spent / SKILL_BUDGET) * 100)

  return (
    <div>
      <div className={`budget-bar${over ? ' over' : ''}`}>
        <span className="field-label">Orçamento de perícias</span>
        <strong>
          {spent} / {SKILL_BUDGET}
        </strong>
        <div className="budget-meter">
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="small muted">
          {over ? `Excedeu ${spent - SKILL_BUDGET} passo(s)` : `${SKILL_BUDGET - spent} restante(s)`}
        </span>
      </div>

      <div className="skill-groups">
        {ATTRIBUTES.map((attribute) => (
          <section className="skill-editor-group" key={attribute.key}>
            <div className="skill-editor-head">
              <DieIcon die="d6" attr={attribute.key} size={14} />
              {ATTR_LABEL[attribute.key]}
            </div>
            {SKILLS.filter((skill) => skill.attr === attribute.key).map((skill) => (
              <div className="skill-editor-row" key={skill.id}>
                <span className="skill-name">
                  {skill.name}
                  <span className="skill-desc">{skill.description}</span>
                </span>
                <DieStep
                  die={character.skills[skill.id]}
                  label={skill.name}
                  onChange={(die) => onChangeSkill(skill.id, die)}
                />
              </div>
            ))}
          </section>
        ))}
      </div>

      <section className="skill-editor-group">
        <div className="skill-editor-head">
          <DieIcon die="d6" attr="mente" size={14} />
          Aptidões
          <span className="badge" style={{ marginLeft: 'auto' }}>
            fora do orçamento
          </span>
        </div>
        {APTITUDES.map((aptitude) => (
          <div className="skill-editor-row" key={aptitude.id}>
            <span className="skill-name">
              {aptitude.name}
              <span className="skill-desc">{aptitude.description}</span>
            </span>
            <DieStep
              die={character.aptitudes[aptitude.id]}
              label={aptitude.name}
              onChange={(die) => onChangeAptitude(aptitude.id, die)}
            />
          </div>
        ))}
      </section>

      <p className="small muted" style={{ marginTop: 14 }}>
        Perícias custam 1 passo por aumento acima de d4. Aptidões são especializações e não entram
        no orçamento de 8 passos.
      </p>
    </div>
  )
}
