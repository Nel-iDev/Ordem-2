import type { AptitudeDef, AttributeDef, SkillDef } from '../types'

export const ATTRIBUTES: AttributeDef[] = [
  {
    key: 'fisico',
    name: 'Físico',
    short: 'FÍS',
    description: 'Força, coordenação, velocidade e fôlego. Sua capacidade corporal.',
  },
  {
    key: 'mente',
    name: 'Mente',
    short: 'MEN',
    description: 'Raciocínio, educação e percepção. Sua capacidade intelectual e sensorial.',
  },
  {
    key: 'emocao',
    name: 'Emoção',
    short: 'EMO',
    description: 'Vontade, magnetismo social e instintos. Sua capacidade psicossocial.',
  },
]

export const SKILLS: SkillDef[] = [
  { id: 'acrobacia', name: 'Acrobacia', attr: 'fisico', description: 'Ginástica, parkour, skate, patins e movimentos acrobáticos.' },
  { id: 'aptidao', name: 'Aptidão', attr: 'mente', description: 'Conhecimento em um campo específico. Use as subáreas abaixo.' },
  { id: 'atletismo', name: 'Atletismo', attr: 'fisico', description: 'Correr, saltar, escalar, nadar e remar.' },
  { id: 'crime', name: 'Crime', attr: 'fisico', description: 'Furtar, abrir fechaduras e falsificar documentos.' },
  { id: 'disciplina', name: 'Disciplina', attr: 'emocao', description: 'Estudar, meditar e resistir a traumas e sustos.' },
  { id: 'enganacao', name: 'Enganação', attr: 'emocao', description: 'Mentir, disfarçar-se e seduzir.' },
  { id: 'furtividade', name: 'Furtividade', attr: 'fisico', description: 'Esconder-se e andar sem ser visto ou ouvido.' },
  { id: 'intimidacao', name: 'Intimidação', attr: 'emocao', description: 'Assustar e coagir pessoas.' },
  { id: 'intuicao', name: 'Intuição', attr: 'emocao', description: 'Sexto sentido para analisar pessoas e ambientes.' },
  { id: 'luta', name: 'Luta', attr: 'fisico', description: 'Atacar desarmado ou com armas corpo a corpo.' },
  { id: 'maquinas', name: 'Máquinas', attr: 'mente', description: 'Operar e consertar máquinas; dirigir veículos motorizados.' },
  { id: 'medicina', name: 'Medicina', attr: 'mente', description: 'Primeiros socorros, tratamentos e necropsias.' },
  { id: 'ocultismo', name: 'Ocultismo', attr: 'mente', description: 'Conhecimento sobre o paranormal.' },
  { id: 'percepcao', name: 'Percepção', attr: 'mente', description: 'Notar coisas pela visão, audição e olfato; revistar lugares.' },
  { id: 'persuasao', name: 'Persuasão', attr: 'emocao', description: 'Convencer pessoas com argumentos e lábia.' },
  { id: 'pesquisa', name: 'Pesquisa', attr: 'mente', description: 'Pesquisar documentos e bancos de dados; analisar evidências.' },
  { id: 'pontaria', name: 'Pontaria', attr: 'fisico', description: 'Atacar com armas de arremesso ou de disparo.' },
  { id: 'sobrevivencia', name: 'Sobrevivência', attr: 'mente', description: 'Montar acampamento, rastrear e acalmar animais.' },
  { id: 'tecnologia', name: 'Tecnologia', attr: 'mente', description: 'Operar dispositivos tecnológicos e hackear redes.' },
  { id: 'vigor', name: 'Vigor', attr: 'fisico', description: 'Manter o fôlego, resistir a venenos e suportar ferimentos.' },
]

export const APTITUDES: AptitudeDef[] = [
  { id: 'artes', name: 'Artes', description: 'Música, dança, escrita, pintura e atuação.' },
  { id: 'atualidades', name: 'Atualidades', description: 'Esporte, entretenimento e cultura popular.' },
  { id: 'burocracia', name: 'Burocracia', description: 'Direito, política, economia e estruturas corporativas.' },
  { id: 'exatas', name: 'Exatas', description: 'Matemática, física, química, biologia, astronomia e geologia.' },
  { id: 'humanas', name: 'Humanas', description: 'História, geografia, filosofia, sociologia e linguística.' },
  { id: 'tatica', name: 'Tática', description: 'Educação militar e estratégica.' },
]

export const ATTR_LABEL: Record<string, string> = {
  fisico: 'Físico',
  mente: 'Mente',
  emocao: 'Emoção',
}

export const ATTR_BY_SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s.attr]))
