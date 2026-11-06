import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react'
import type { AptitudeId, AttrKey, Character, Die, ProfileId, SkillId } from '../types'
import { OCCUPATION_BY_ID } from '../data/occupations'
import { createEmptyCharacter, syncAbilities, validateCharacter } from '../lib/character'
import { useCharacters } from '../context/characters'
import { useToast } from '../context/toast'
import { IdentityStep } from './steps/IdentityStep'
import { ProfileStep } from './steps/ProfileStep'
import { OccupationStep } from './steps/OccupationStep'
import { AttributesStep } from './steps/AttributesStep'
import { SkillsStep } from './steps/SkillsStep'
import { ReviewStep } from './steps/ReviewStep'

const STEPS = [
  {
    id: 'identity',
    label: 'Identidade',
    title: 'Quem é o agente?',
    subtitle: 'Nome, aparência e o conceito que resume o personagem.',
  },
  {
    id: 'profile',
    label: 'Perfil',
    title: 'Como ele enfrenta o paranormal?',
    subtitle: 'O perfil define a habilidade de assinatura e a cor da ficha.',
  },
  {
    id: 'occupation',
    label: 'Ocupação',
    title: 'O que ele fazia antes?',
    subtitle: 'A ocupação concede uma habilidade e pode aumentar os PV.',
  },
  {
    id: 'attributes',
    label: 'Atributos',
    title: 'Corpo, mente e emoção',
    subtitle: 'Distribua 8 passos entre os três atributos.',
  },
  {
    id: 'skills',
    label: 'Perícias',
    title: 'O que ele sabe fazer?',
    subtitle: 'Distribua 8 passos entre as perícias. Aptidões são especializações.',
  },
  {
    id: 'review',
    label: 'Revisão',
    title: 'Última checagem',
    subtitle: 'Ajuste recursos, nível e valide a ficha antes de salvar.',
  },
] as const

export function Wizard() {
  const navigate = useNavigate()
  const { save } = useCharacters()
  const { notify } = useToast()
  const [draft, setDraft] = useState<Character>(() => createEmptyCharacter())
  const [step, setStep] = useState(0)
  const [maxStep, setMaxStep] = useState(0)
  const [freeMode, setFreeMode] = useState(false)

  const update = (patch: Partial<Character>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const changeProfile = (profile: ProfileId) => {
    setDraft((current) => {
      const next = { ...current, profile }
      return { ...next, abilities: syncAbilities(next) }
    })
  }

  const changeOccupation = (occupationId: string) => {
    setDraft((current) => {
      const occupation = OCCUPATION_BY_ID[occupationId]
      const next = {
        ...current,
        occupationId,
        occupation: occupation?.name ?? current.occupation,
      }
      return { ...next, abilities: syncAbilities(next) }
    })
  }

  const changeAttr = (attr: AttrKey, die: Die) => {
    setDraft((current) => ({
      ...current,
      attributes: { ...current.attributes, [attr]: die },
    }))
  }

  const changeSkill = (id: SkillId, die: Die) => {
    setDraft((current) => ({
      ...current,
      skills: { ...current.skills, [id]: die },
    }))
  }

  const changeAptitude = (id: AptitudeId, die: Die) => {
    setDraft((current) => ({
      ...current,
      aptitudes: { ...current.aptitudes, [id]: die },
    }))
  }

  const errors = useMemo(() => validateCharacter(draft, freeMode), [draft, freeMode])

  const goNext = () => {
    if (step === 0 && !draft.name.trim()) {
      notify('Dê um nome ao personagem antes de continuar.', 'danger')
      return
    }
    const next = Math.min(step + 1, STEPS.length - 1)
    setStep(next)
    setMaxStep((current) => Math.max(current, next))
  }

  const goBack = () => setStep((current) => Math.max(0, current - 1))

  const finish = () => {
    const problems = validateCharacter(draft, freeMode)
    if (problems.length) {
      notify(problems[0], 'danger')
      return
    }
    try {
      save({ ...draft, updatedAt: Date.now() })
      notify('Ficha salva com sucesso.', 'success')
      navigate(`/ficha/${draft.id}`)
    } catch {
      notify('Não foi possível salvar a ficha neste navegador.', 'danger')
    }
  }

  const meta = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100
  const isLast = step === STEPS.length - 1

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Novo registro</span>
          <h1 className="page-title">
            Criar <span className="accent" style={{ color: 'var(--accent)' }}>ficha</span>
          </h1>
          <p className="page-sub">
            Seis etapas rápidas. Você pode voltar e ajustar qualquer escolha antes de salvar.
          </p>
        </div>
        <Link to="/" className="btn btn-ghost">
          <ArrowLeft size={15} aria-hidden="true" /> Voltar ao arquivo
        </Link>
      </div>

      <div className="wizard">
        <aside className="wizard-side">
          <span className="eyebrow">Etapa {step + 1} de {STEPS.length}</span>
          <div className="wizard-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="wizard-steps">
            {STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`wizard-step${index === step ? ' active' : ''}${index < step ? ' done' : ''}`}
                disabled={index > maxStep}
                onClick={() => setStep(index)}
              >
                <span className="wizard-num">
                  {index < step ? <Check size={12} aria-hidden="true" /> : index + 1}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <section className="wizard-panel">
          <div className="wizard-panel-head">
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>

          <div className="wizard-body">
            {step === 0 ? <IdentityStep character={draft} onChange={update} /> : null}
            {step === 1 ? (
              <ProfileStep selected={draft.profile} onSelect={changeProfile} />
            ) : null}
            {step === 2 ? (
              <OccupationStep selected={draft.occupationId} onSelect={changeOccupation} />
            ) : null}
            {step === 3 ? (
              <AttributesStep character={draft} onChangeAttr={changeAttr} />
            ) : null}
            {step === 4 ? (
              <SkillsStep
                character={draft}
                onChangeSkill={changeSkill}
                onChangeAptitude={changeAptitude}
              />
            ) : null}
            {step === 5 ? (
              <ReviewStep
                character={draft}
                errors={errors}
                freeMode={freeMode}
                onToggleFreeMode={setFreeMode}
                onChange={update}
              />
            ) : null}
          </div>

          <div className="wizard-actions">
            {step === 0 ? (
              <Link to="/" className="btn btn-ghost">
                Cancelar
              </Link>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={goBack}>
                <ArrowLeft size={15} aria-hidden="true" /> Voltar
              </button>
            )}

            {isLast ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={finish}>
                <Save size={16} aria-hidden="true" /> Salvar ficha
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                Avançar <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
