import { describe, expect, it } from 'vitest';
import { corrigir, montarVocabulario, som } from '../src/corretor.js';

// vocabulário parecido com o do catálogo de verdade
const vocabulario = montarVocabulario([
  'daqui pra sempre manu bahtidao',
  'garrafa de gin manu bahtidao',
  'karaoke banda batidao do melody diva',
  'coracao na cama gustavo mioto',
  'ai se eu te pego michel telo',
  'bara bara bere bere michel telo',
  'thriller michael jackson',
  'someone like you ed sheeran',
  'umbrella rihanna',
  'how you remind me nickelback',
  'pelados em santos mamonas assassinas',
]);

describe('som', () => {
  it('h mudo, y, ph, th, w, k e letras dobradas', () => {
    expect(som('bahtidao')).toBe('batidao');
    expect(som('rhianna')).toBe(som('rihanna'));
    expect(som('assasinas')).toBe(som('assassinas'));
    expect(som('sheran')).toBe(som('sheeran'));
    expect(som('phelipe')).toBe('felipe');
    expect(som('thiago')).toBe('tiago');
    expect(som('wesley')).toBe('veslei');
    expect(som('nickelback')).toBe('nicelbac');
  });

  it('m no fim soa como n; "eao" soa como "iao"', () => {
    expect(som('bom')).toBe(som('bon'));
    expect(som('jobim')).toBe(som('jobin'));
    expect(som('piao')).toBe(som('peao'));
    // m no meio continua
    expect(som('mamonas')).toBe('mamonas');
  });

  it('ch, lh e nh continuam', () => {
    expect(som('chitaozinho')).toBe('chitaozinho');
    expect(som('malha')).toBe('malha');
  });
});

describe('corrigir', () => {
  it('"batidao" vale também "bahtidao", mesmo existindo "batidao"', () => {
    expect(corrigir(['manu', 'batidao'], vocabulario)).toEqual([['manu'], ['batidao', 'bahtidao']]);
  });

  it('erros de digitação reais viram a palavra do catálogo', () => {
    expect(corrigir(['gostavo'], vocabulario)).toEqual([['gustavo']]);
    expect(corrigir(['rhianna'], vocabulario)).toEqual([['rihanna']]);
    expect(corrigir(['sheran'], vocabulario)).toEqual([['sheeran']]);
    expect(corrigir(['nickleback'], vocabulario)).toEqual([['nickelback']]);
    expect(corrigir(['mamonas', 'assasinas'], vocabulario)).toEqual([['mamonas'], ['assassinas']]);
  });

  it('"micheal" vira "michael" (mesmo tamanho), não "michel", que aparece mais', () => {
    expect(corrigir(['micheal', 'jackson'], vocabulario)).toEqual([['michael'], ['jackson']]);
  });

  it('nada muda: devolve null', () => {
    expect(corrigir(['michel', 'telo'], vocabulario)).toBeNull();
    expect(corrigir(['gin'], vocabulario)).toBeNull();
    expect(corrigir(['xyzwqk'], vocabulario)).toBeNull();
  });

  it('menos de 4 letras não é corrigida, fora as terminadas em m ou n', () => {
    expect(corrigir(['gix', 'gostavo'], vocabulario)).toEqual([['gix'], ['gustavo']]);
    expect(corrigir(['gim'], vocabulario)).toEqual([['gin']]);
  });

  it('m/n no fim e pião/peão', () => {
    const v = montarVocabulario(['livin on a prayer bon jovi', 'garota de ipanema tom jobim', 'peao todo tatuado jeninho', 'aai wos cey']);
    expect(corrigir(['bom', 'jovi'], v)).toEqual([['bon'], ['jovi']]);
    expect(corrigir(['jobin'], v)).toEqual([['jobim']]);
    expect(corrigir(['piao', 'todo', 'tatuado'], v)).toEqual([['peao'], ['todo'], ['tatuado']]);
    // 3 letras sem m/n no fim continuam de fora ("aai" errava na medida)
    expect(corrigir(['aay'], v)).toBeNull();
  });

  it('empate na distância: a mais frequente; depois ordem alfabética', () => {
    const v = montarVocabulario(['bolada', 'balada balada', 'belada']);
    expect(corrigir(['bxlada'], v)).toEqual([['balada']]);
    const w = montarVocabulario(['bolada', 'belada']);
    expect(corrigir(['bxlada'], w)).toEqual([['belada']]);
  });

  it('trocas erradas vistas na medida: primeira letra diferente, folga demais, palavra curta', () => {
    const v = montarVocabulario(['o careta roberto carlos', 'arruma a mala', 'patrick dimon', 'matando no cansaco', 'seja bem vindo', 'tears for fears']);
    expect(corrigir(['aretha'], v)).toBeNull();
    expect(corrigir(['haruka'], v)).toBeNull();
    expect(corrigir(['digimon'], v)).toBeNull();
    expect(corrigir(['matanza'], v)).toBeNull();
    expect(corrigir(['soja'], v)).toBeNull();
  });

  it('palavras juntas viram as palavras do catálogo, em sequência', () => {
    const v = montarVocabulario(['cedo ou tarde nx zero', 'que sorte a nossa bruno e marrone']);
    expect(corrigir(['nxzero'], v)).toEqual([['nx zero']]);
    // "bruno" vem da distância (1 letra a mais); a separação entra depois
    expect(corrigir(['brunoe'], v)).toEqual([['bruno', 'bruno e']]);
  });

  it('palavra que existe ou de 3 letras não é separada', () => {
    const v = montarVocabulario(['cedo ou tarde nx zero', 'que sorte a nossa bruno e marrone']);
    expect(corrigir(['marrone'], v)).toBeNull();
    expect(corrigir(['ane'], v)).toBeNull();
  });

  it('b/v na primeira letra vale na correção por distância', () => {
    const v = montarVocabulario(['zap zum pabllo vittar', 'eu sou neguinha vanessa da mata', 'borboletas victor e leo']);
    expect(corrigir(['bittar'], v)).toEqual([['vittar']]);
    expect(corrigir(['banessa'], v)).toEqual([['vanessa']]);
    expect(corrigir(['vorboletas'], v)).toEqual([['borboletas']]);
    // outras primeiras letras continuam tendo de ser iguais
    expect(corrigir(['fittar'], v)).toBeNull();
  });

  it('b/v entre vogais ou antes de l/r, também em palavra que existe', () => {
    const v = montarVocabulario(['girlfriend avril lavigne', 'te desejo vida fabio de melo', 'embolou pablo', 'abril de 1984']);
    // "abril" existe, mas "avril" também vale
    expect(corrigir(['abril', 'lavigne'], v)).toEqual([['abril', 'avril'], ['lavigne']]);
    expect(corrigir(['favio'], v)).toEqual([['fabio']]);
    expect(corrigir(['pavlo'], v)).toEqual([['pablo']]);
    // b/v só no meio: "vida" não vira "bida"
    expect(corrigir(['vida'], v)).toBeNull();
  });

  it('4 e 5 letras: uma letra trocada por uma vizinha no teclado', () => {
    const v = montarVocabulario(['imortal sandy', 'tears for fears', 'e o amor zeze di camargo', 'sal da terra']);
    expect(corrigir(['sabdy'], v)).toEqual([['sandy']]);
    expect(corrigir(['ampr'], v)).toEqual([['amor']]);
    // revisto em 11/10: d e s são vizinhas
    expect(corrigir(['teard'], v)).toEqual([['tears']]);
    // p não é vizinha de d
    expect(corrigir(['sanpy'], v)).toBeNull();
    // duas letras trocadas, ou a primeira letra trocada: nada
    expect(corrigir(['sabsy'], v)).toBeNull();
    expect(corrigir(['dandy'], v)).toBeNull();
    // 3 letras não passam pela tecla vizinha
    expect(corrigir(['sak'], v)).toBeNull();
  });

  it('vocabulário vazio: null', () => {
    expect(corrigir(['gostavo'], montarVocabulario([]))).toBeNull();
  });
});
