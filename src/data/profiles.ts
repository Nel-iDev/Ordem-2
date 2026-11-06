import type { ProfileDef } from '../types'

export const PROFILES: ProfileDef[] = [
  {
    id: 'executor',
    name: 'Executor',
    tagline: 'Age primeiro, pensa depois.',
    description:
      'Impulsivo e perseverante. Tira força dos próprios fracassos e vence pela insistência. O Executor ganha Ímpeto quando erra e pode transformar essa energia em bônus.',
    accent: '#ff5a5f',
    ability: {
      id: 'perfil-executor',
      name: 'Ímpeto',
      origin: 'perfil',
      cost: '1 ou 3 espaços de Ímpeto',
      description:
        'Você tem uma barra de Ímpeto com 3 espaços. Ao falhar em um teste, preenche 1 espaço. Gaste 1 espaço para receber +d4 em um teste; gaste 3 espaços para aumentar um atributo em 1 passo até o fim da cena.',
      mechanic: 'impeto',
    },
  },
  {
    id: 'analista',
    name: 'Analista',
    tagline: 'Observa, entende, prepara. Depois age.',
    description:
      'Calmo e ponderado. Pode demorar para agir, mas quando age é com precisão cirúrgica. O Analista estuda o ambiente e acumula dados bônus para os momentos decisivos.',
    accent: '#4cc9f0',
    ability: {
      id: 'perfil-analista',
      name: 'Avaliação',
      origin: 'perfil',
      cost: '1 ação + 2 PD',
      description:
        'Gaste uma ação e 2 PD para observar um ser ou ambiente. Receba dois d4 para usar em testes relativos àquele alvo: +2d4 em um teste ou +d4 em dois testes. Não acumula mais de dois dados bônus por esta habilidade.',
      pdCost: 2,
      mechanic: 'avaliacao',
    },
  },
  {
    id: 'vigilante',
    name: 'Vigilante',
    tagline: 'Sempre atento. Sempre pronto.',
    description:
      'Percebe o que os outros deixam passar e reage antes que o perigo se forme. O Vigilante se adapta a imprevistos e pode quebrar a ordem natural de um conflito.',
    accent: '#b388ff',
    ability: {
      id: 'perfil-vigilante',
      name: 'Prontidão',
      origin: 'perfil',
      cost: '3 PD',
      description:
        'No início de qualquer conflito, gaste 3 PD para ganhar uma rodada na qual age antes dos demais personagens e NPCs.',
      pdCost: 3,
      mechanic: 'prontidao',
    },
  },
]

export const PROFILE_BY_ID = Object.fromEntries(PROFILES.map((p) => [p.id, p]))
