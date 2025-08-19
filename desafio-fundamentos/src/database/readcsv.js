import fs from 'fs';
import { parse } from 'csv-parse';

const csvFilePath = './tasks.csv';

async function readAndSendCSV() {
  const parser = fs
    .createReadStream(csvFilePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  for await (const record of parser) {
    const { title, description } = record;

    try {
      const response = await fetch('http://localhost:3334/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      });

      if (response.ok) {
        console.log(`Task enviada com sucesso: ${title}`);
      } else {
        console.error(`Erro ao enviar task: ${title} | Status: ${response.status}`);
      }
    } catch (err) {
      console.error('Erro de requisição:', err);
    }
  }
}

readAndSendCSV();