import { readFile, writeFile } from 'fs/promises';

export async function isAlreadyClient(thisClient) {
  const filePath = 'clients.json';

  let data = [];
  try {
    const fileData = await readFile(filePath, 'utf-8');
    data = JSON.parse(fileData);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const existingClientIndex = data.findIndex(
    c => c.lastname === thisClient.lastname && c.firstname === thisClient.firstname
  );

  if (existingClientIndex !== -1) {
    if (!Array.isArray(data[existingClientIndex].articles)) {
      data[existingClientIndex].articles = [];
    }

    if (
      data[existingClientIndex].articles.length > 0 &&
      !Array.isArray(data[existingClientIndex].articles[0])
    ) {
      data[existingClientIndex].articles = [data[existingClientIndex].articles];
    }

    data[existingClientIndex].articles.push(thisClient.articles);
  } else {
    data.push(thisClient);
  }

  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}