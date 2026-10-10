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