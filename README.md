# busca-tolerante-ptbr

Busca que entende o que a pessoa **quis** digitar, em português.

Quem busca música no celular, no meio de uma festa, escreve rápido e do jeito que fala: "rianna", "sabdy", "nxzero", "mamonas assasinas". Esta biblioteca transforma o que foi digitado nas palavras que existem na sua base, sem dicionário externo e sem serviço pago.

**Em produção no [Karaoque](https://karaoque.app.br)**, karaokê para festas em casa, buscando num catálogo de 26 mil músicas.

## O que ela corrige

| Digitado | Vira | Por quê |
|---|---|---|
| `evidencia` | `evidencias` | letra faltando |
| `rianna` | `rihanna` | grafia que soa igual (h mudo) |
| `mamonas assasinas` | `mamonas assassinas` | letra dobrada |
| `sabdy` | `sandy` | tecla vizinha no teclado do celular |
| `abril lavigne` | `avril lavigne` | b e v trocados |
| `nxzero` | `nx zero` | palavras grudadas |

Os exemplos acima são reais: saem do código desta biblioteca com uma base de 9 músicas.

## Como usar

```ts
import { corrigir, montarVocabulario, normalizar } from 'busca-tolerante-ptbr';

// 1. Monte o vocabulário com os textos da sua base (títulos, nomes, produtos...)
const vocabulario = montarVocabulario([
  'Evidências Chitãozinho & Xororó',
  'Umbrella Rihanna',
  'Sozinho Sandy',
]);

// 2. Normalize o que a pessoa digitou e corrija palavra por palavra
const palavras = normalizar('Rianna').split(' ');
corrigir(palavras, vocabulario);
// → [['rihanna']]
```

`corrigir` devolve, para cada palavra, **até 5 alternativas** que existem na base (a mais frequente primeiro). Se nada precisa mudar, devolve `null`, e você busca com o texto original.

Com as alternativas em mãos, monte a busca no seu banco: cada palavra casa com qualquer uma das suas alternativas.

## Como funciona

1. **Forma sonora do português** (`som`): grafias que soam igual viram a mesma chave. `ph` → `f`, `th` → `t`, `y` → `i`, `w` → `v`, `k` → `c`, h mudo, letras dobradas, `m` final soa como `n` ("bom" e "bon"), "peão" e "pião".
2. **Troca de b e v**: comum no português falado ("abril" → "avril", "favio" → "fabio").
3. **Distância de edição** (Damerau-Levenshtein com limite): letra trocada, faltando, sobrando ou duas vizinhas invertidas. Só em palavras de 6 letras ou mais, e a primeira letra precisa bater, para não trocar "aretha" por "careta".
4. **Tecla vizinha**: em palavras de 4 e 5 letras, aceita uma letra trocada por uma vizinha no teclado QWERTY.
5. **Palavras grudadas**: "nxzero" → "nx zero", quando os pedaços existem na base.

Palavras curtas demais ficam como estão: corrigir "de" ou "eu" mais atrapalha do que ajuda.

## Por que não usar uma biblioteca de busca pronta?

Bibliotecas genéricas de busca aproximada não conhecem o português falado: não sabem que "h" é mudo, que "b" e "v" se confundem, nem que "m" no fim soa como "n". Esta nasceu de buscas reais que voltavam vazias no Karaoque, e cada regra existe porque alguém digitou daquele jeito.

## Rodar os testes

```bash
npm install
npm test
```

## Licença

MIT. Feito por [Miqueias Marques](https://www.linkedin.com/in/miqueiasmarques-dev).
