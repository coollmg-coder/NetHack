export const FIELD_LABELS = {
  0: 'Title',
  1: 'Str',
  2: 'Dex',
  3: 'Con',
  4: 'Int',
  5: 'Wis',
  6: 'Cha',
  7: 'Align',
  10: 'Gold',
  11: 'Pw',
  12: 'PwMax',
  13: 'Exp',
  14: 'AC',
  18: 'HP',
  19: 'HPMax',
  20: 'Dlvl',
  22: 'Cond',
};

export function fieldLabel(index) {
  return FIELD_LABELS[index] ?? String(index);
}

export function createStatusStore() {
  const values = new Map();
  return {
    update(field, value) {
      values.set(field, value);
    },
    get(field) {
      return values.get(field);
    },
    entries() {
      return [...values.entries()];
    },
  };
}
