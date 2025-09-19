import OpenAI from "openai";
import fs from "node:fs";

const schemas = JSON.parse(fs.readFileSync("input_data/dev_tables.json"));

const client = new OpenAI({
    apiKey: "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"
});

function returnSchema(id){
    const schema = schemas.find(schema => schema.db_id === id);
    return schema;
}

async function prompt(query, schema){
    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: "Translate the following natural language question into an SQLlite SQL query for a database with the provided schema. Do not respond with anything except SQL. DO NOT use any newlines. All SQL should be on a single line. \nSchema: " + schema + "\nQuestion: " + query
    });
    return response.output_text;
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

  // Make predictions.json match the gold format: SQL \t DBID
  const outDict = {};   // <-- declare it here
  for (let i = 0; i < predictions.length; i++) {
    const { question_id, SQL } = predictions[i];
    const db_id = queries.find(q => q.question_id === question_id).db_id;
    const oneLineSQL = String(SQL).replace(/\s+/g, " ").trim();
    outDict[String(i)] = `${oneLineSQL}\t${db_id}`;
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