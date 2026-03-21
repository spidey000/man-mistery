const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'data', 'man_exposicion_permanente_objetos.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.objects.forEach((obj, index) => {
  // Rename to Misterio X in the UI later, but here we can just update the hints
  // The user says "La pista 1 y lista 2 están muy bien, los vamos a llamar misterio 1 , misterio 2... Usa el estilo de los dos primeros misterios para todos los demás."
  
  // We will generate 5 hints for each object based on its existing hints and answer.
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
