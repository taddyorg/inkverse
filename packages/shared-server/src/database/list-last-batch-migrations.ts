import { database } from './index.js';
import readline from 'readline';

async function listLastBatchMigrations(): Promise<void> {
  const rl: readline.Interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const { rows } = await database.raw("SELECT * FROM migrations WHERE batch = (SELECT MAX(batch) FROM migrations)");
    console.log('Migrations from the last batch:', rows);

    const answer = await askQuestion(rl, 'Are you sure you want to rollback the migration? (y/n) ');

    if (answer.toLowerCase() === 'y') {
      await database.migrate.rollback();
      console.log('Rollback completed.');
    } else {
      console.log('Rollback aborted.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    rl.close();
    process.exit(0);
  }
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

listLastBatchMigrations()
