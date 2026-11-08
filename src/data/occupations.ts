import type { OccupationDef } from '../types'

export const OCCUPATIONS: OccupationDef[] = [
  {
    id: 'cientista',
    name: 'Cientista',
    summary: 'Pesquisador, médico, engenheiro ou acadêmico. A mente é a ferramenta de trabalho.',
    ability: {
      id: 'ocupacao-cientista',
      name: 'Foco Mental',
      origin: 'ocupacao',
      cost: '2 PD',
      description: 'Em um teste mental, gaste 2 PD para receber +d4 no teste.',
      pdCost: 2,
      mechanic: 'foco-mental',
    },
  },
  {
    id: 'artista',
    name: 'Artista',
    summary: 'Músico, ator, escritor ou performer. Sabe ler a emoção das pessoas e do ambiente.',
    ability: {
      id: 'ocupacao-artista',
      name: 'Foco Emocional',
      origin: 'ocupacao',
      cost: '2 PD',
      description: 'Em um teste emocional, gaste 2 PD para receber +d4 no teste.',
      pdCost: 2,
      mechanic: 'foco-emocional',
    },
  },
  {
    id: 'professor',
    name: 'Professor',
    summary: 'Ensinar é fazer o outro enxergar o que já estava na frente dele.',
    ability: {
      id: 'ocupacao-professor',
      name: 'Mentoria',
      origin: 'ocupacao',
      cost: 'Passivo',
      description:
        'Quando ajuda outro personagem, faça um teste da perícia usada para ajudar contra DT 7. Se passar, o personagem ajudado pode substituir um dos dados rolados pela sua rolagem alta.',
      mechanic: 'mentoria',
    },
  },
  {
    id: 'profissional-de-escritorio',
    name: 'Profissional de escritório',
    summary: 'Rotina, burocracia e tecnologia. Sabe navegar sistemas e encontrar a informação certa.',
    ability: {
      id: 'ocupacao-profissional',
      name: 'Conhecimento Técnico',
      origin: 'ocupacao',
      cost: 'Passivo',
      description: 'Uma perícia mental à sua escolha é aumentada para d6. A escolha é registrada na ficha e aplicada automaticamente nas rolagens.',
      mechanic: 'conhecimento-tecnico',
    },
  },
  {
    id: 'operario',
    name: 'Operário',
    summary: 'Trabalho pesado, resistência e mãos calejadas. Sabe aguentar o que a maioria não aguenta.',
    ability: {
      id: 'ocupacao-operario',
      name: 'Esforço e Suor',
      origin: 'ocupacao',
      cost: 'Passivo',
      description: 'Uma perícia física à sua escolha é aumentada para d6. A escolha é registrada na ficha e aplicada automaticamente nas rolagens.',
      mechanic: 'esforco-e-suor',
    },
  },
]

export const OCCUPATION_BY_ID = Object.fromEntries(OCCUPATIONS.map((o) => [o.id, o]))
