const fs = require('fs');
const path = require('path');

// Write a sample file for demonstration
fs.writeFileSync(path.join(__dirname, "./sample-files/sample.txt"), "Hello, async world!", "utf8");

// 1. Callback style
fs.readFile(path.join(__dirname, "./sample-files/sample.txt"), "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  console.log(`callback: ${data}`);
});
  // Callback hell example (test and leave it in comments):
  // Callback hell is when multiple nested callbacks are used with asychronous programming.
  // This can make the code difficult to read and maintain. The example below reads a file, and uses a callback to handle success and error cases.
  // The success portion of the callback writes to the read file, and uses another callback to check for success and error cases again.
  // fs.readFile(path.join(__dirname, "./sample-files/sample.txt"), "utf8", (err, data) => {
  //   if (err) {
  //     console.error("Error reading file:", err);
  //     return;
  //   }
  //   fs.writeFile(path.join(__dirname, "./sample-files/sample.txt"), "In callback hell..", "utf8", (err, data) => {
  //     if (err) {
  //       console.error("Error writing file:", err);
  //       return;
  //     }
  //     console.log(data);
  //   });
  // });

// 2. Promise style
fs.promises.readFile(path.join(__dirname, "./sample-files/sample.txt"), "utf8").then((data) => { console.log(`promise: ${data}`); }).catch((err) => { console.error("Error:", err); });

// 3. Async/Await style
async function AsyncStyle() {
  try {
    const data = await fs.promises.readFile(path.join(__dirname, "./sample-files/sample.txt"), "utf8");
    console.log(`async/await: ${data}`);
  } catch (err) {
    console.error("Error:", err);
  }
}
AsyncStyle();