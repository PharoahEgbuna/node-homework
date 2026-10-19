const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const cpus = os.cpus();
console.log(`Platform: ${os.platform()}`);
console.log(`CPU: ${cpus[0].model}`);
console.log(`Total Memory: ${os.totalmem()}`);

// Path module
console.log(`Joined path: ${path.join(__dirname, 'sample-files', 'sample.txt')}`);

// fs.promises API
fs.promises.writeFile(path.join(__dirname, 'sample-files', 'demo.txt'), 'Hello, from fs.promises!', 'utf8');
fs.promises.readFile(path.join(__dirname, 'sample-files', 'demo.txt'), 'utf8').then(data => console.log(`fs.promises read: ${data}`));

// Streams for large files- log first 40 chars of each chunk
const writeStream = fs.createWriteStream(path.join(__dirname, 'sample-files', 'largefile.txt'), { encoding: 'utf8' });

for (let i = 0; i < 100; i++) {
  writeStream.write(`Line ${i + 1}\n`);
}
writeStream.end();

writeStream.on('finish', () => {
  const readStream = fs.createReadStream(path.join(__dirname, 'sample-files', 'largefile.txt'), {
    encoding: 'utf8',
    highWaterMark: 1024
  });

  readStream.on('data', (chunk) => {
    console.log(`Read chunk: ${chunk.slice(0, 40)}`);
  });

  readStream.on('end', () => {
    console.log('Finished reading large file with streams.');
  });

  readStream.on('error', (err) => {
    console.error('Read error:', err);
  });
});