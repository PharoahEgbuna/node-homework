# Node.js Fundamentals

## What is Node.js?
Node is a runtime environment used to run server-side Javascript. 

## How does Node.js differ from running JavaScript in the browser?
Browser sanboxes are unable to read local files, start  servers, or access private information. Node.js makes up for those shortcomings by being able to perform these tasks and more. 

## What is the V8 engine, and how does Node use it?
The V8 engine is the program used by Node.js that reads  JavaScript code and translates it to  machine language which the computer can understand. 

## What are some key use cases for Node.js?
Node is essentially the inverse of the browser sandbox. This means it can read and write files, start web servers, read environemnt varibales, work with operating systems, and usebackend libraries. 

## Explain the difference between CommonJS and ES Modules. Give a code example of each.
CommonJS and ES Modules are both formats that use different syntax to share code between JavaScript files. The former is used with older versions Node.js, while the latter is used by browsers and newer versions of Node.

**CommonJS (default in Node.js):**
```js
const { register, logoff } = require("../filepath");
``` 

**ES Modules (supported in modern Node.js):**
```js
import { useMemo } from react;
```