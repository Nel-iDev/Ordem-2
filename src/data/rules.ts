export interface CriticalFailure {
  roll: number
  name: string
  description: string
}

export const CRITICAL_FAILURES: CriticalFailure[] = [
  { roll: 1, name: 'Vexame', description: 'Descreva a ação de forma vergonhosa. Sem efeito mecânico adicional.' },
  { roll: 2, name: 'Machucado', description: 'Seu Físico diminui em 1 passo até o fim da cena.' },
  { roll: 3, name: 'Desatenção', description: 'Sua Mente diminui em 1 passo até o fim da cena.' },
  { roll: 4, name: 'Irritação', description: 'Sua Emoção diminui em 1 passo até o fim da cena.' },
  { roll: 5, name: 'Acidente', description: 'Você perde d4 PV.' },
  { roll: 6, name: 'Frustração', description: 'Você perde d4 PD.' },
  { roll: 7, name: 'Perda', description: 'Um item carregado ou um espaço de compra se perde.' },
  { roll: 8, name: 'Nenhum efeito adicional', description: 'A falha crítica não causa consequência extra.' },
]

export const RULE_NOTES = [
  {
    title: 'Teste básico',
    body: 'Role 1 dado de atributo + 1 dado de perícia. Some os resultados e compare com a DT. A DT padrão é 7.',
  },
  {
    title: 'Crítico',
    body: 'Se dois ou mais dados rolados tiverem o mesmo valor e esse valor for 6 ou mais, o teste é um sucesso crítico, independentemente da DT.',
  },
  {
    title: 'Falha crítica',
    body: 'Se todos os dados rolados derem 1, o teste falha automaticamente e sofre uma consequência extra (role 1d8 na tabela).',
  },
  {
    title: 'Rolagem alta e baixa',
    body: 'RA é o maior valor rolado; RB é o menor. Algumas ações usam esses valores em vez da soma.',
  },
  {
    title: 'Passos',
    body: 'Aumentar um passo significa subir na escala d4 → d6 → d8 → d10 → d12. Diminuir faz o caminho inverso. O mínimo é d4.',
  },
  {
    title: 'Muitos dados',
    body: 'Um teste pode rolar no máximo 4 dados e somar no máximo 3. O site soma automaticamente os 3 maiores.',
  },
]
