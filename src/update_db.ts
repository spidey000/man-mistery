import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'man_exposicion_permanente_objetos.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.objects.forEach((obj: any, index: number) => {
  const answer = obj.possible_answers[0].value;
  const h1 = obj.hint_ladder_template.hint_1 || "Observa bien los detalles de la pieza.";
  const h2 = obj.hint_ladder_template.hint_2 || "Piensa en su forma y para qué servía.";
  const h3 = obj.hint_ladder_template.hint_3 || "Es algo muy común.";
  
  obj.hint_ladder_template = {
    hint_1: h1,
    hint_2: h2,
    hint_3: h3,
    hint_4: `La respuesta empieza por la letra '${answer.charAt(0).toUpperCase()}'.`,
    hint_5: `La respuesta exacta que buscas es: ${answer.toUpperCase()}`
  };
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Database updated!');
