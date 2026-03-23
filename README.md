# Stitch to Tailwind Converter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-green.svg)](https://tailwindcss.com/)

## Descrição

O **Stitch to Tailwind Converter** é uma ferramenta web open source projetada para a comunidade de desenvolvedores frontend que trabalham com design systems. Ela converte arquivos `DESIGN.md` do [Google Stitch](https://stitch.withgoogle.com/) – um formato legível e estruturado para definir tokens, componentes e padrões de UI – em configurações Tailwind CSS v4 prontas para uso.

Inspirado na necessidade de migrar design systems editoriais e premium para frameworks modernos como Tailwind, o app gera:

- CSS customizado via `@layer` para componentes e padrões avançados (ex.: gradientes, glassmorphism, "No-Line Rule").
- Suporte completo a escopo: tokens, componentes e regras (Do's/Don'ts).

Desenvolvido com foco em usabilidade para indie hackers e times ágeis, o app é uma solução prática para acelerar protótipos e integrações em projetos React/Next.js. Como projeto open source, ele incentiva contribuições da comunidade para expandir parsers e suporte a variações de Stitch.

**Por que isso importa?** Em um ecossistema onde design systems como Stitch promovem equilíbrio entre auditoria corporativa e bem-estar humano, esta ferramenta democratiza a adaptação para Tailwind, reduzindo boilerplate e mantendo fidelidade 1:1. Imagine transformar um MD em um config pronto em segundos – isso é o que impulsiona inovação em escala.

## Funcionalidades

- **Interface Split-Screen Responsiva:** Editor de texto à esquerda para colar o conteúdo do `DESIGN.md` (com syntax highlighting para Markdown); preview de output à direita com tabs para Config, CSS e Preview Visual.
- **Conversão Automática e Robusta:** Parsing via Remark + regex customizados para extrair tokens (ex.: cores como `primary: #006067`), tipografia (Manrope/Inter), elevation (tonal layering) e componentes (buttons com gradientes 135°).
- **Output Modular:**
  - CSS com `@theme`: Definição de cores, fonts, spacing e shadows via diretiva CSS.
  - CSS `@layer`: Classes para padrões como "Signature Gradient", "Glassmorphism" (backdrop-blur 24px) e "Ghost Border".
  - Warnings inline para ambiguidades (ex.: cores inválidas validadas via Zod).
- **Opções de Exportação:** Copy para clipboard (config/CSS separadamente), Download ZIP (com TS/CSS/Readme) ou single-file JS embedável.
- **Preview Visual:** Amostras interativas de componentes (ex.: card com tonal layering) renderizadas com Tailwind inline, sem dependências externas.
- **Performance e A11y:** Web Workers para parsing off-thread; semântica ARIA, navegação por teclado e foco visível. Mobile-first (stack vertical em <768px).
- **Escalável para Open Source:** Suporte a uploads múltiplos; extensível para outros DS (ex.: Figma tokens via forks).

Métrica de sucesso: Conversão <10s, 90%+ fidelidade em tokens, e crescimento via GitHub stars/forks.

## Stack Técnica

- **Frontend:** Vite com React 18 + TypeScript.
- **UI/Estilo:** Tailwind CSS v4 + shadcn/ui (baseado em Radix UI) + lucide-react (ícones).
- **Parsing/Validação:** Remark para MD AST, regex para tokens, Zod para schemas (ex.: validação de hex colors).
- **Estado:** useState/useMemo para colocation; nenhum global desnecessário (Zustand só se cross-page em futuras features).

Princípios: RSC-first para performance; CDD para componentes modulares; A11y shift-left (semântica HTML, foco trap em previews).

## Uso

1. **Acesse o App:** Abra o site hospedado ou rode localmente.
2. **Cole o DESIGN.md:** No editor esquerdo, insira o conteúdo do seu arquivo Stitch (ex.: seções de Colors, Typography, Components).
3. **Converta:** Clique em "Converter" – o parsing ocorre em <5s, com skeleton loading.
4. **Revise Output:**
   - **Tab CSS:** Copie o `@theme` + `@layer` gerado para seu arquivo CSS principal.
   - **Tab Preview:** See visual samples (ex.: button com gradient primary).
5. **Exporte:** Use botões para copy ou download ZIP. Integre no seu projeto.
   **Exemplo de Input/Output:**

- Input: Seção Colors do Stitch (`primary (#006067)`).
- Output: `@theme { --color-primary: #006067; }` + `.btn-primary { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container)); }`.

Para casos edge (ex.: gradientes custom), o app emite warnings – revise manualmente para 100% fidelidade.

## Contribuição

Este projeto é totalmente open source e aberto à contribuições.

**Como Contribuir:**

1. **Fork e Clone:** Crie um fork e submeta PRs via GitHub.
2. **Issues:** Reporte bugs ou sugira features (ex.: suporte a Figma exports) no [Issues tab](https://github.com/seu-usuario/stitch-to-tailwind-converter/issues).
3. **Guidelines:**
   - Siga CDD: Novos componentes em `/components/`, utils em `/lib/`.
   - Commit: Conventional Commits (ex.: `feat: add Figma support`).
   - Docs: Atualize este README e adicione exemplos em `/examples/`.
4. **Ideias Fora da Caixa:** São sempre bem-vindas 😁, inclusive se você usar alguma IA para gerar código. Só certifique-se de que o código está de acordo com as boas práticas e segurança.

## Licença

Distribuído sob a [MIT License](LICENSE). Veja o arquivo LICENSE para detalhes.

## Autor

**luiztux**
