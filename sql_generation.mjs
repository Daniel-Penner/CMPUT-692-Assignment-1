import OpenAI from "openai";
import fs from "node:fs";

const schemas = JSON.parse(fs.readFileSync("input_data/dev_tables.json", "utf-8"));

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
        input: "Translate the following natural language question into an SQL query for a database with the provided schema. Do not respond with anything except SQL. \nSchema: " + schema + "\nQuestion: " + query
    });
    console.log(response.output_text);
    return response.output_text;
}

(async () => {
try{
    const predictions = [];
    const queries = JSON.parse(fs.readFileSync("input_data/queries.json", "utf-8"));
    for(const query of queries){
        const sql = await prompt(query.question, returnSchema(query.db_id));
        predictions.push({
            question_id: query.question_id,
            SQL: sql
    });
    }
    fs.writeFileSync("output_data/predictions.json", JSON.stringify(predictions, null, 2));
} catch(error){
    console.error(error);
}
});