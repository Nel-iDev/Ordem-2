# Arquivo 2

Fichas de personagem, perícias e rolagens para um RPG de investigação paranormal. Aplicação
100% client-side em React + TypeScript + Vite: nenhum dado sai do navegador.

## Funcionalidades

- **Arquivo de agentes** — lista em cards com busca, ordenação, importação/exportação em JSON,
  duplicação e exclusão com confirmação.
- **Criação em 6 etapas** — identidade, perfil, ocupação, atributos, perícias e revisão, com
  medidores de orçamento (8 passos para atributos e 8 para perícias) e modo livre validado.
- **Ficha completa** — PV, PD, Ímpeto, atributos com penalidades por condição, perícias e
  aptidões roláveis, habilidades, inventário, anotações e histórico de rolagens.
- **Rolagem integrada** — teste de atributo + perícia (+ até 2d4 de bônus), DT configurável,
  regra dos 4 dados / 3 maiores, RA/RB, sucesso e falha críticos, tabela de 1d8 com aplicação
  automática de consequências (PV, PD e condições).
- **Salvamento automático** — cada alteração na ficha é gravada no `localStorage` após uma
  pequena pausa, com indicador de "Salvando…"/"Salvo".

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

## Armazenamento local

As fichas ficam em `localStorage` sob a chave `arquivo2.characters.v1` e as rolagens em
`arquivo2.rolls.v1`. Limpar os dados do site no navegador apaga tudo — use **Exportar tudo** no
arquivo para manter um backup em JSON. A importação aceita uma ficha ou uma lista e gera novos
IDs para registros que colidam com fichas já existentes.

> As aptidões não entram no orçamento de 8 passos de perícia; elas são especializações
> adicionais.
