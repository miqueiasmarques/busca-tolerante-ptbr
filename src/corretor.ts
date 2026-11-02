import { normalizar } from './normalizar.js';

// Busca que tolera grafia diferente: cada palavra ganha as alternativas que o catálogo conhece
const MIN_LETRAS = 4;
// "bom" → "bon": de 3 letras, só as terminadas em m ou n (as outras erravam: "aai", "wos")
const MIN_LETRAS_MN = 3;
// por distância é mais arriscado: só palavra de 6 letras ou mais
const MIN_LETRAS_DISTANCIA = 6;
const MAX_ALTERNATIVAS = 5;
// "nxzero" → "nx zero": só palavra de 4 letras ou mais
const MIN_LETRAS_JUNTAS = 4;

interface Entrada {
  palavra: string;
  som: string;
  vezes: number;
}

export interface Vocabulario {
  vezes: Map<string, number>;
  porSom: Map<string, Entrada[]>;
  porTamanhoDoSom: Map<number, Entrada[]>;
  porTamanho: Map<number, Entrada[]>;
  // todas as palavras, até as de 1 e 2 letras ("nx", "e"): só para separar palavras juntas
  todas: Map<string, number>;
}

// Forma "sonora" do português: grafias que soam igual viram a mesma coisa
export function som(palavra: string): string {
  return (
    palavra
      .replace(/ph/g, 'f')
      .replace(/th/g, 't')
      .replace(/(^|[^cln])h/g, '$1')
      .replace(/y/g, 'i')
      .replace(/w/g, 'v')
      .replace(/k/g, 'c')
      // "piao" e "peao"
      .replace(/eao/g, 'iao')
      .replace(/(.)\1+/g, '$1')
      // "bom" e "bon", "jobim" e "jobin"
      .replace(/m$/, 'n')
  );
}

function agrupar<K>(mapa: Map<K, Entrada[]>, chave: K, entrada: Entrada): void {
  const lista = mapa.get(chave);
  if (lista) lista.push(entrada);
  else mapa.set(chave, [entrada]);
}

export function montarVocabulario(textos: string[]): Vocabulario {
  const vezes = new Map<string, number>();
  const todas = new Map<string, number>();
  for (const texto of textos) {
    for (const palavra of normalizar(texto).split(' ')) {
      if (palavra.length === 0) continue;
      todas.set(palavra, (todas.get(palavra) ?? 0) + 1);
      if (palavra.length >= 3) vezes.set(palavra, (vezes.get(palavra) ?? 0) + 1);
    }
  }
  const porSom = new Map<string, Entrada[]>();
  const porTamanhoDoSom = new Map<number, Entrada[]>();
  const porTamanho = new Map<number, Entrada[]>();
  for (const [palavra, n] of vezes) {
    const entrada = { palavra, som: som(palavra), vezes: n };
    agrupar(porSom, entrada.som, entrada);
    agrupar(porTamanhoDoSom, entrada.som.length, entrada);
    agrupar(porTamanho, palavra.length, entrada);
  }
  return { vezes, porSom, porTamanhoDoSom, porTamanho, todas };
}

// Letra trocada, faltando, sobrando ou duas vizinhas invertidas contam 1; passou do limite, para
function distancia(a: string, b: string, limite: number): number {
  let anterior2: number[] = [];
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(anterior[j]! + 1, atual[j - 1]! + 1, anterior[j - 1]! + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, anterior2[j - 2]! + 1);
      atual.push(d);
      menor = Math.min(menor, d);
    }
    if (menor > limite) return limite + 1;
    anterior2 = anterior;
    anterior = atual;
  }
  return anterior[b.length]!;
}

// a mais frequente primeiro; empate, ordem alfabética
const maisFrequente = (a: Entrada, b: Entrada): number => b.vezes - a.vezes || (a.palavra < b.palavra ? -1 : 1);

// b e v se confundem no começo da palavra ("bittar" → "vittar", "banessa" → "vanessa")
const BV = new Set(['b', 'v']);
function mesmaPrimeira(a: string, b: string): boolean {
  return a[0] === b[0] || (BV.has(a[0] ?? '') && BV.has(b[0] ?? ''));
}

// "sabdy" → "sandy": de 4 e 5 letras, só uma letra trocada por uma vizinha no teclado
const MIN_LETRAS_TECLADO = 4;
const FILEIRAS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const VIZINHAS = new Map<string, Set<string>>();
FILEIRAS.forEach((fileira, f) => {
  [...fileira].forEach((letra, i) => {
    const perto = [fileira[i - 1], fileira[i + 1], FILEIRAS[f - 1]?.[i], FILEIRAS[f - 1]?.[i + 1], FILEIRAS[f + 1]?.[i - 1], FILEIRAS[f + 1]?.[i]];
    VIZINHAS.set(letra, new Set(perto.filter((l): l is string => l !== undefined)));
  });
});

function umaVizinhaTrocada(a: string, b: string): boolean {
  let trocas = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    trocas++;
    if (trocas > 1 || !VIZINHAS.get(a[i]!)?.has(b[i]!)) return false;
  }
  return trocas === 1;
}

function porTeclaVizinha(palavra: string, vocabulario: Vocabulario): string[] {
  if (palavra.length < MIN_LETRAS_TECLADO) return [];
  const achadas = (vocabulario.porTamanho.get(palavra.length) ?? [])
    .filter((e) => e.palavra[0] === palavra[0] && umaVizinhaTrocada(palavra, e.palavra))
    .sort(maisFrequente);
  return achadas.length > 0 ? [achadas[0]!.palavra] : [];
}

function porDistancia(palavra: string, alvo: string, vocabulario: Vocabulario): string[] {
  if (palavra.length < MIN_LETRAS_DISTANCIA) return porTeclaVizinha(palavra, vocabulario);
  // erro de digitação quase nunca está na primeira letra ("aretha" não é "careta"), fora b/v
  const limite = palavra.length >= 8 ? 2 : 1;
  let melhor: { entrada: Entrada; d: number; tamanho: number } | null = null;
  for (let tam = alvo.length - limite; tam <= alvo.length + limite; tam++) {
    for (const entrada of vocabulario.porTamanhoDoSom.get(tam) ?? []) {
      if (!mesmaPrimeira(entrada.palavra, palavra)) continue;
      const d = distancia(alvo, entrada.som, limite);
      if (d > limite) continue;
      const tamanho = Math.abs(entrada.palavra.length - palavra.length);
      const ganha =
        !melhor ||
        d < melhor.d ||
        (d === melhor.d && (tamanho < melhor.tamanho || (tamanho === melhor.tamanho && maisFrequente(entrada, melhor.entrada) < 0)));
      if (ganha) melhor = { entrada, d, tamanho };
    }
  }
  return melhor ? [melhor.entrada.palavra] : [];
}

// "nxzero" → "nx zero", "brunoe" → "bruno e": 2 ou 3 pedaços que existem no catálogo; os mais frequentes primeiro.
// A busca exige os pedaços vizinhos e inteiros, então só acha texto com eles em sequência.
function separadas(palavra: string, vocabulario: Vocabulario): string[] {
  if (palavra.length < MIN_LETRAS_JUNTAS) return [];
  const vezes = (p: string): number => vocabulario.todas.get(p) ?? 0;
  const achadas: { texto: string; vezes: number }[] = [];
  for (let i = 1; i < palavra.length; i++) {
    const a = palavra.slice(0, i);
    if (vezes(a) === 0) continue;
    const resto = palavra.slice(i);
    if (vezes(resto) > 0) achadas.push({ texto: `${a} ${resto}`, vezes: Math.min(vezes(a), vezes(resto)) });
    for (let j = 1; j < resto.length; j++) {
      const b = resto.slice(0, j);
      const c = resto.slice(j);
      if (vezes(b) > 0 && vezes(c) > 0) achadas.push({ texto: `${a} ${b} ${c}`, vezes: Math.min(vezes(a), vezes(b), vezes(c)) });
    }
  }
  return achadas.sort((x, y) => y.vezes - x.vezes || (x.texto < y.texto ? -1 : 1)).map((x) => x.texto);
}

const curtaDemais = (palavra: string): boolean =>
  palavra.length < MIN_LETRAS && !(palavra.length >= MIN_LETRAS_MN && /[mn]$/.test(palavra));

// "abril" → "avril", "favio" → "fabio": b e v se confundem depois de vogal e antes de vogal, l ou r
function trocasBV(palavra: string, vocabulario: Vocabulario): string[] {
  const achadas: string[] = [];
  for (let i = 1; i < palavra.length - 1; i++) {
    const letra = palavra[i];
    if ((letra !== 'b' && letra !== 'v') || !/[aeiou]/.test(palavra[i - 1]!) || !/[aeioulr]/.test(palavra[i + 1]!)) continue;
    const outra = palavra.slice(0, i) + (letra === 'b' ? 'v' : 'b') + palavra.slice(i + 1);
    if (vocabulario.vezes.has(outra)) achadas.push(outra);
  }
  return achadas;
}

function alternativas(palavra: string, vocabulario: Vocabulario): string[] {
  if (curtaDemais(palavra)) return [palavra];
  const alvo = som(palavra);
  const mesmoSom = (vocabulario.porSom.get(alvo) ?? []).filter((e) => e.palavra !== palavra).sort(maisFrequente);
  const bv = trocasBV(palavra, vocabulario);
  if (vocabulario.vezes.has(palavra)) return [palavra, ...bv, ...mesmoSom.map((e) => e.palavra)].slice(0, MAX_ALTERNATIVAS);

  const parecidas =
    mesmoSom.length > 0
      ? mesmoSom.slice(0, MAX_ALTERNATIVAS).map((e) => e.palavra)
      : bv.length > 0
        ? bv
        : porDistancia(palavra, alvo, vocabulario);
  const todas = [...parecidas, ...separadas(palavra, vocabulario)].slice(0, MAX_ALTERNATIVAS);
  return todas.length > 0 ? todas : [palavra];
}

export function corrigir(palavras: string[], vocabulario: Vocabulario): string[][] | null {
  const resultado = palavras.map((p) => alternativas(p, vocabulario));
  const mudou = resultado.some((alts, i) => alts.length !== 1 || alts[0] !== palavras[i]);
  return mudou ? resultado : null;
}
