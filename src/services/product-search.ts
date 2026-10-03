import type { Product } from '../types/product';

const synonymGroups = [
  ['denim', 'denims', 'jean', 'jeans'],
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

function tokenize(value: string): string[] {
  return normalize(value).match(/[a-z0-9]+/g) ?? [];
}

function getProductTerms(product: Product): string[] {
  const tags = Array.isArray(product.tags) ? product.tags.join(' ') : product.tags ?? '';
  return tokenize([product.title, product.description, product.category ?? '', tags].join(' '));
}

function editDistance(left: string, right: string): number {
  let previousRow = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const currentRow = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      currentRow[rightIndex] = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      );
    }
    previousRow = currentRow;
  }

  return previousRow[right.length];
}

function getTermVariants(term: string): string[] {
  const group = synonymGroups.find((synonyms) => synonyms.includes(term));
  return group ? [...group] : [term];
}

function scoreTerm(queryTerm: string, productTerms: string[]): number {
  let bestScore = 0;

  for (const variant of getTermVariants(queryTerm)) {
    for (const productTerm of productTerms) {
      if (variant === productTerm) {
        bestScore = Math.max(bestScore, variant === queryTerm ? 1 : 0.94);
        continue;
      }
      if (productTerm.startsWith(variant) || variant.startsWith(productTerm)) {
        bestScore = Math.max(bestScore, 0.86);
        continue;
      }

      const maxDistance = Math.max(1, Math.floor(Math.max(variant.length, productTerm.length) * 0.28));
      const distance = editDistance(variant, productTerm);
      if (distance <= maxDistance) {
        bestScore = Math.max(bestScore, 0.82 - distance * 0.08);
      }
    }
  }

  return bestScore;
}

export interface ProductSearchMatch {
  product: Product;
  score: number;
}

export function rankProducts(products: Product[], query: string, matchAnyTerm = false): ProductSearchMatch[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) {
    return products.map((product) => ({ product, score: 1 }));
  }

  return products
    .map((product) => {
      const productTerms = getProductTerms(product);
      const termScores = queryTerms.map((term) => scoreTerm(term, productTerms));
      const score = matchAnyTerm
        ? Math.max(...termScores)
        : termScores.reduce((total, termScore) => total + termScore, 0) / termScores.length;
      return {
        product,
        score,
        matchesAllTerms: termScores.every((termScore) => termScore >= 0.58),
        matchesAnyTerm: termScores.some((termScore) => termScore >= 0.58),
      };
    })
    .filter((match) => matchAnyTerm ? match.matchesAnyTerm : match.matchesAllTerms)
    .sort((first, second) => second.score - first.score)
    .map(({ product, score }) => ({ product, score }));
}

export function searchProducts(products: Product[], query: string): Product[] {
  return rankProducts(products, query).map(({ product }) => product);
}