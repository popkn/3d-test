import { createGuideFunction } from '../../../kit/wheelGuide.js';
export function create(model, ui) { return createGuideFunction(model, ui, { motors: [['15', '서보모터 (약 15 rpm으로 천천히)']] }); }
