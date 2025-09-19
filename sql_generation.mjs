import OpenAI from "openai";
import fs from "node:fs";
import "dotenv/config";

const schemas = JSON.parse(fs.readFileSync("input_data/dev_tables.json"));

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

function returnSchema(id){
    const schema = schemas.find(schema => schema.db_id === id);
    return schema;
}

function formatSchema(schema) {
  const tables = schema.table_names_original;
  const columns = schema.column_names_original
    .map(([tid, col]) => (tid === -1 ? col : `${tables[tid]}.${col}`));

  return `Tables:\n  ${tables.join(", ")}\nColumns:\n  ${columns.join(", ")}`;
}

async function prompt(query, schema) {

  const systemRules = `
Translate the natural language question into a simple, effective SQLite query.

RULES:
1. Use ONLY the provided table and column names.
2. Use ONLY names that appear in the schema description (no synonyms).
3. Do not invent new tables, columns, or values.
4. Output must be a single line with no explanations or non-SQL text.
5. Prefer the simplest correct form that exactly matches the question intent.
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: `${systemRules}
Schema: ${formatSchema(schema)} 
Question: ${query}`});

  if (!response.output_text) {
    throw new Error("Empty model response");
  }

  return response.output_text.trim();
}


(async () => {
try {
  const predictions = [];
  const queries = JSON.parse(fs.readFileSync("input_data/queries.json", "utf8"));

  for (const query of queries) {
    const sql = await prompt(query.question, returnSchema(query.db_id));
    console.log(sql);
    predictions.push({ question_id: query.question_id, SQL: sql });
  }

  const outDict = {};
  for (let i = 0; i < predictions.length; i++) {
    const { question_id, SQL } = predictions[i];
    const oneLineSQL = String(SQL).replace(/\s+/g, " ").trim();
    outDict[String(question_id)] = oneLineSQL;
  }

  fs.writeFileSync(
    "C:/Users/Daniel/Documents/GitHub/CMPUT-692-Assignment-1/evaluation_repo/sql_result/predictions.json",
    JSON.stringify(outDict, null, 2),
    { encoding: "utf8" }
  );

} catch (error) {
  console.error(error);
}
})();