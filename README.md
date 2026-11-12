# Ordem 2

Fichas de personagem, perícias e rolagens para um RPG de investigação paranormal. Aplicação
100% client-side em React + TypeScript + Vite: nenhum dado sai do navegador.

## Funcionalidades

- **Arquivo de agentes** — lista em cards com busca, ordenação, importação/exportação em JSON,
  duplicação e exclusão com confirmação.
- **Criação em 6 etapas** — identidade, perfil, ocupação, atributos, perícias e revisão, com
  medidores de orçamento (8 passos para atributos e 8 para perícias) e modo livre validado.
- **Ficha em abas** — cabeçalho do agente, resumo com atributos, recursos e condições, e abas
  para perícias, habilidades, inventário, descrição e histórico de rolagens.
- **Rolagem integrada** — teste de atributo + perícia (+ até 2d4 de bônus), DT configurável,
  regra dos 4 dados / 3 maiores, RA/RB, sucesso e falha críticos, tabela de 1d8 com aplicação
  automática de consequências (PV, PD e condições).
- **Salvamento automático** — cada alteração na ficha é gravada no `localStorage` após uma
  pequena pausa, com indicador de "Salvando…"/"Salvo".
- **Habilidades automatizadas** — custos em PD, cargas, escolhas de perícia, bônus de
  atributo e ajudas de Mentoria são aplicados pelo motor de regras, com status de
  "Ativa", "Disponível" ou "Requisito pendente" em cada habilidade.
- **Mesa de combate** — cenas com ordem de iniciativa, rodada extra de Prontidão, turno
  atual, PV/PD de agentes e NPCs, condições e marcação de participantes fora de combate.
- **Campanhas e sessões** — mesas com status (ativa, pausada ou encerrada), elenco vinculado
  às fichas do arquivo e diário de sessões com data, resumo e anotações.

## Regras de PV e PD (playtest)

- **Base pelos atributos** — o PV base é a face máxima do dado de **Físico** e o PD base é a
  face máxima do dado de **Emoção** (`d4 → 4`, `d6 → 6`, `d8 → 8`, `d10 → 10`, `d12 → 12`).
- **Pontos por nível** — cada nível após o 1º concede **6 pontos** livremente distribuídos entre
  PV e PD. O total disponível é `6 × (nível − 1)`.
- **Máximos derivados** — `PV máx = face(Físico) + pontos em PV` e
  `PD máx = face(Emoção) + pontos em PD`. Os máximos são calculados automaticamente; os valores
  atuais são ajustados quando o máximo sobe ou desce.
- **Ocupação** — não concede mais bônus fixo de PV; fornece apenas a habilidade de assinatura.

## Habilidades

O motor fica em `src/lib/abilities.ts` e não altera permanentemente atributos ou
perícias: os efeitos são derivados na hora da rolagem e registrados no estado
`abilityState` da ficha. Isso evita aplicar o mesmo bônus duas vezes ao recarregar.

| Habilidade | Automação |
| --- | --- |
| **Foco Mental / Foco Emocional** | Opção de +d4 no diálogo de rolagem do atributo correspondente, cobrando 2 PD. |
| **Avaliação** | Botão para observar um alvo (2 PD), gerando 2 cargas de d4. A rolagem oferece +2d4 em um teste ou +d4 em dois testes, sem passar de 2 cargas. |
| **Ímpeto** | Falhas preenchem 1 espaço; 1 espaço compra +d4 na rolagem; 3 espaços compram +1 passo de atributo até o fim da cena. |
| **Prontidão** | Botão para gastar 3 PD antes do combate; na mesa, o agente recebe uma rodada extra antes de todos. O uso é limpo ao encerrar a cena. |
| **Mentoria** | Modo "Ajudar aliado" no diálogo, com teste contra DT 7. Se passar, gera uma ajuda que outro personagem pode usar para substituir o menor dado contado pela sua rolagem alta. |
| **Conhecimento Técnico** | Seleção de uma perícia mental; a perícia passa a usar d6 (ou mantém o dado maior) nas rolagens. |
| **Esforço e Suor** | Seleção de uma perícia física; a perícia passa a usar d6 (ou mantém o dado maior) nas rolagens. |
| **Personalizada** | Permanece manual: o motor não interpreta o texto escrito pelo jogador. |

### Dúvidas de regra documentadas

- **Avaliação — custo de ação.** O aplicativo ainda não tem economia de ações, então a
  ativação cobra apenas os 2 PD. A relevância do alvo para cada teste é uma decisão do
  jogador: o diálogo mostra o alvo observado, mas não tenta adivinhar se o teste se
  relaciona a ele.
- **Avaliação — acúmulo.** A habilidade diz que não acumula mais de dois dados. Reobservar
  substitui o alvo e repõe as cargas em 2; não somamos cargas antigas.
- **Prontidão — rodada extra.** A mesa executa a rodada adicional antes da rodada 1 e não
  repete a prioridade nas rodadas seguintes. O uso continua disponível na ficha para
  conflitos resolvidos fora da mesa; "Novo conflito" libera a habilidade manualmente.
- **Mentoria — ajudas simultâneas.** A regra não define se vários ajudantes podem
  substituir dados no mesmo teste. A implementação permite **uma ajuda por rolagem**; o
  jogador escolhe qual ajuda usar. As ajudas ficam em `localStorage` e são consumidas ao
  serem aplicadas.
- **Ímpeto — bônus de atributo.** Os 3 espaços são um uso separado do +d4 de 1 espaço. O
  bônus é derivado (não altera o dado-base) e termina pelo botão "Encerrar cena"; não é
  possível acumular dois bônus de atributo ao mesmo tempo.
- **Conhecimento Técnico / Esforço e Suor.** "Aumentada para d6" foi tratado como "pelo
  menos d6": quem já tem d8 ou mais mantém o dado maior.

## Mesa de combate

A mesa fica em `/combate` e guarda cada cena separadamente. O motor de regras está em
`src/lib/combat.ts` e a persistência em `arquivo2.combats.v1`.

- **Participantes** — agentes do arquivo são vinculados à ficha e usam PV, PD e condições ao
  vivo; NPCs guardam PV/PD próprios. Uma ficha removida do arquivo permanece na cena apenas
  como registro, até ser retirada.
- **Iniciativa** — o valor é digitado pela mesa, do maior para o menor. O material atual não
  define uma rolagem de iniciativa, então o aplicativo não inventa uma fórmula.
- **Prontidão** — agentes com a habilidade ativa entram numa rodada extra antes da rodada 1.
  A prioridade vale apenas nessa rodada; depois todos seguem a iniciativa normal.
- **Turnos** — "Próximo turno" avança para o próximo participante vivo, pula os marcados como
  fora de combate e incrementa a rodada ao fechar a lista.
- **Encerramento** — encerrar a cena limpa Prontidão e o bônus de atributo do Ímpeto dos
  agentes participantes. PV, PD, condições e espaços de Ímpeto permanecem nas fichas.
- **Dúvidas de regra.** Não há economia de ações: ativar Prontidão na mesa só é oferecido
  antes do início e cobra os 3 PD. A ordem de iniciativa, os valores de PV/PD de NPCs e a
  decisão de quando um participante está fora de combate ficam a cargo da mesa.

## Campanhas e sessões

A lista fica em `/campanhas` e cada campanha em `/campanhas/:id`. O motor de regras está em
`src/lib/campaigns.ts` e a persistência em `arquivo2.campaigns.v1`.

- **Organização, não automação de regras** — a campanha reúne fichas e registra sessões; ela
  não calcula XP, níveis ou recompensas. O material atual não define esses fluxos.
- **Elenco** — a campanha guarda apenas os IDs das fichas, então nome, perfil, nível e PV/PD
  exibidos vêm sempre da ficha atual. Excluir um personagem o desvincula automaticamente de
  todas as campanhas, sem apagar o histórico das sessões.
- **Status** — `ativa`, `pausada` ou `encerrada`; o status é informativo e não bloqueia
  edições.
- **Sessões** — título, data (`AAAA-MM-DD`), resumo e anotações, ordenadas da mais recente
  para a mais antiga. Sessões sem data usam a data de criação como referência de ordem.
- **Exclusão** — apagar uma campanha remove suas sessões, mas mantém as fichas no arquivo.

## Requisitos

- Node.js 20 ou superior
- npm

## Scripts

```bash
npm install     # instala as dependências
npm run dev     # servidor de desenvolvimento com HMR
npm run build   # checagem de tipos + build de produção em dist/
npm run preview # serve o build de produção
npm run lint    # oxlint
npm test        # Vitest (execução única)
```

## Estrutura

```
src/
  components/   # UI da ficha, rolagens e componentes genéricos
  context/      # providers e hooks de personagens e toasts
  creation/     # wizard de criação e suas etapas
  data/         # perfis, ocupações, perícias e regras
  hooks/        # useDebouncedSave
  lib/          # motor de regras (dice, character, abilities, combat, storage) + testes
  pages/        # Arquivo, criação, ficha, combate, campanhas e 404
  types.ts      # tipos do domínio
```

## Deploy no GitHub Pages

O deploy é automático pelo workflow `.github/workflows/deploy.yml` a cada push na `main`. Ele
roda lint e testes, gera o build e publica `dist/`.

**Configuração necessária uma única vez:** em *Settings → Pages → Build and deployment*, defina
a **Source** como **GitHub Actions**. A opção "Deploy from a branch" serve o código-fonte cru e
não funciona com Vite.

O site fica em `https://<usuario>.github.io/Ordem-2/`. Por isso o build usa `base: '/Ordem-2/'`
e o `BrowserRouter` recebe `basename` a partir de `import.meta.env.BASE_URL`. Para publicar em
domínio próprio ou na raiz, rode o build com `VITE_BASE="/"`.

O workflow copia `dist/index.html` para `dist/404.html`, o que permite abrir ou recarregar
rotas como `/ficha/:id`, `/combate` e `/campanhas/:id` diretamente no Pages.

## Armazenamento local

As fichas ficam em `localStorage` sob a chave `arquivo2.characters.v1`, as rolagens em
`arquivo2.rolls.v1`, as ajudas pendentes de Mentoria em `arquivo2.mentoria.v1`, as cenas de
combate em `arquivo2.combats.v1` e as campanhas com suas sessões em
`arquivo2.campaigns.v1`. As duas primeiras chaves foram mantidas para preservar fichas criadas
antes da renomeação para **Ordem 2**. Limpar os dados do site no navegador apaga tudo — use
**Exportar tudo** no arquivo para manter um backup em JSON. A importação aceita uma ficha ou
uma lista e gera novos IDs para registros que colidam com fichas já existentes.

> As aptidões não entram no orçamento de 8 passos de perícia; elas são especializações
> adicionais.
