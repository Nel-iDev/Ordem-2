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
| **Prontidão** | Botão para gastar 3 PD e marcar a habilidade como usada no conflito, com reinício manual. |
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
- **Prontidão — rodada extra.** O aplicativo não possui iniciativa/combate nesta etapa,
  então o botão apenas cobra os 3 PD e marca o uso. A rodada adicional é resolvida na mesa
  e o botão "Novo conflito" libera a habilidade novamente.
- **Mentoria — ajudas simultâneas.** A regra não define se vários ajudantes podem
  substituir dados no mesmo teste. A implementação permite **uma ajuda por rolagem**; o
  jogador escolhe qual ajuda usar. As ajudas ficam em `localStorage` e são consumidas ao
  serem aplicadas.
- **Ímpeto — bônus de atributo.** Os 3 espaços são um uso separado do +d4 de 1 espaço. O
  bônus é derivado (não altera o dado-base) e termina pelo botão "Encerrar cena"; não é
  possível acumular dois bônus de atributo ao mesmo tempo.
- **Conhecimento Técnico / Esforço e Suor.** "Aumentada para d6" foi tratado como "pelo
  menos d6": quem já tem d8 ou mais mantém o dado maior.

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
  lib/          # motor de regras (dice, character, storage) + testes
  pages/        # Arquivo, criação, ficha e 404
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
rotas como `/ficha/:id` diretamente no Pages.

## Armazenamento local

As fichas ficam em `localStorage` sob a chave `arquivo2.characters.v1`, as rolagens em
`arquivo2.rolls.v1` e as ajudas pendentes de Mentoria em `arquivo2.mentoria.v1`. As duas
primeiras chaves foram mantidas para preservar fichas criadas antes da renomeação para
**Ordem 2**. Limpar os dados do site no navegador apaga tudo — use **Exportar tudo** no
arquivo para manter um backup em JSON. A importação aceita uma ficha ou uma lista e gera novos
IDs para registros que colidam com fichas já existentes.

> As aptidões não entram no orçamento de 8 passos de perícia; elas são especializações
> adicionais.
