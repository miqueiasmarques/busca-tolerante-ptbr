import { describe, expect, it } from 'vitest';
import { normalizar } from '../src/normalizar.js';

describe('normalizar', () => {
  it('tira acento, pontuação e caixa alta', () => {
    expect(normalizar('Evidências!')).toBe('evidencias');
    expect(normalizar('Coração na Cama')).toBe('coracao na cama');
    expect(normalizar('  Zezé Di Camargo & Luciano  ')).toBe('zeze di camargo luciano');
  });

  it('mantém números e junta espaços', () => {
    expect(normalizar('Ai Se Eu Te Pego (2011)')).toBe('ai se eu te pego 2011');
    expect(normalizar('a---b___c')).toBe('a b c');
  });
});
