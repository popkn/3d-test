import { createGuideFunction } from '../../../kit/wheelGuide.js';
export function create(model, ui) { return createGuideFunction(model, ui, { motors: [['130', 'DC 모터 130 rpm'], ['400', 'DC 모터 400 rpm']] }); }
