import { createSpinFunction } from '../../../kit/setFunction.js';
export function create(model, ui) { return createSpinFunction(model, ui, { dia: 50, axis: 'x', note: ' (축에서 헛돎)' }); }
