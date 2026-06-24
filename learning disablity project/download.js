import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const destDir = path.join(__dirname, 'public', 'models');
const destFile = path.join(destDir, 'brain.glb');
const sourceUrl = 'https://raw.githubusercontent.com/savir2010/Aurna/main/brain.glb';

console.log('Target directory:', destDir);
console.log('Target file:', destFile);

// Create directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading brain.glb from:', sourceUrl);

const file = fs.createWriteStream(destFile);

https.get(sourceUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error('Failed to download brain.glb. HTTP Status:', response.statusCode);
    file.close();
    try {
      fs.unlinkSync(destFile);
    } catch (e) {}
    process.exit(1);
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Download complete and saved to:', destFile);
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error downloading file:', err.message);
  file.close();
  try {
    fs.unlinkSync(destFile);
  } catch (e) {}
  process.exit(1);
});
