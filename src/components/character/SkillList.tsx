import { Dices } from 'lucide-react'
import type {
  AptitudeId,
  AttrKey,
  Character,
  Die,
  RollableSkill,
  SkillId,
} from '../../types'
import { APTITUDES, ATTRIBUTES, ATTR_LABEL, SKILLS } from '../../data/skills'
import { effectiveSkillDie } from '../../lib/abilities'
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
    <div className="skills-container">
      <h3 className="skills-title">Perícias</h3>
      <table className="skills-table">
        <thead>
          <tr>
            <th className="skill-col-name">Perícia</th>
            <th className="skill-col-attr">Atributo</th>
            <th className="skill-col-die">Dado</th>
            <th className="skill-col-test">Teste</th>
          </tr>
        </thead>
        {ATTRIBUTES.map((attribute) => {
          const penalty = penalties[attribute.key] ?? 0
          return (
            <tbody key={attribute.key}>
              <tr className="skill-group-row">
                <td colSpan={4}>
                  <span className={`attr-chip attr-chip-${attribute.key}`}>
                    <DieIcon die="d6" attr={attribute.key} size={13} />
                    {ATTR_LABEL[attribute.key]}
                  </span>
                  {penalty > 0 ? (
                    <span className="badge badge-danger">
                      −{penalty} passo{penalty > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </td>
              </tr>
              {SKILLS.filter((skill) => skill.attr === attribute.key).map((skill) => {
                const baseDie = character.skills[skill.id]
                const die = effectiveSkillDie(character, skill.id)
                const boosted = die !== baseDie
                const rollable: RollableSkill = {
                  id: skill.id,
                  name: skill.name,
                  attr: skill.attr,
                  die,
                  kind: 'skill',
                }
                return (
                  <tr className="skill-row" key={skill.id}>
                    <td>
                      <button
                        type="button"
                        className="skill-name-btn"
                        title={`${skill.description} (${die}${
                          boosted ? `, base ${baseDie} + habilidade` : ''
                        })`}
                        onClick={() => onRoll(rollable)}
                      >
                        {skill.name}
                      </button>
                    </td>
                    <td className="skill-cell-attr">
                      <span className={`attr-chip attr-chip-${attribute.key}`}>
                        {ATTR_LABEL[attribute.key]}
                      </span>
                    </td>
                    <td>
                      <span className="skill-die">
                        <DieIcon die={die} attr={attribute.key} size={19} />
                        {die}
                        {boosted ? (
                          <span
                            className="badge badge-accent"
                            title={`Habilidade eleva a base ${baseDie} para ${die}`}
                          >
                            hab.
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <div className="skill-row-actions">
                        <DieStep
                          die={baseDie}
                          label={skill.name}
                          onChange={(next) => onSkillDie(skill.id, next)}
                        />
                        <button
                          type="button"
                          className="skill-roll-btn"
                          onClick={() => onRoll(rollable)}
                          aria-label={`Rolar ${skill.name}`}
                        >
                          <Dices size={13} aria-hidden="true" /> Rolar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          )
        })}
      </table>

      <div className="aptitude-box">
        <h3 className="skills-title">
          Aptidões
          <span className="badge">fora do orçamento</span>
        </h3>
        <table className="skills-table">
          <thead>
            <tr>
              <th className="skill-col-name">Aptidão</th>
              <th className="skill-col-attr">Atributo</th>
              <th className="skill-col-die">Dado</th>
              <th className="skill-col-test">Teste</th>
            </tr>
          </thead>
          <tbody>
            {APTITUDES.map((aptitude) => {
              const die = character.aptitudes[aptitude.id]
              const rollable: RollableSkill = {
                id: `aptidao-${aptitude.id}`,
                name: `Aptidão (${aptitude.name})`,
                attr: 'mente',
                die,
                kind: 'aptitude',
              }
              return (
                <tr className="skill-row" key={aptitude.id}>
                  <td>
                    <button
                      type="button"
                      className="skill-name-btn"
                      title={`${aptitude.description} (${die})`}
                      onClick={() => onRoll(rollable)}
                    >
                      {aptitude.name}
                    </button>
                  </td>
                  <td className="skill-cell-attr">
                    <span className="attr-chip attr-chip-mente">
                      {ATTR_LABEL.mente}
                    </span>
                  </td>
                  <td>
                    <span className="skill-die">
                      <DieIcon die={die} attr="mente" size={19} />
                      {die}
                    </span>
                  </td>
                  <td>
                    <div className="skill-row-actions">
                      <DieStep
                        die={die}
                        label={aptitude.name}
                        onChange={(next) => onAptitudeDie(aptitude.id, next)}
                      />
                      <button
                        type="button"
                        className="skill-roll-btn"
                        onClick={() => onRoll(rollable)}
                        aria-label={`Rolar aptidão ${aptitude.name}`}
                      >
                        <Dices size={13} aria-hidden="true" /> Rolar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
