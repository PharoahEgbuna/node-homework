const express = require("express");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const { randomUUID } = require("crypto");
const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.
function contentTypeValidation() {
  return (req, res, next) => {
    if (req.method === "POST" && req.headers["content-type"] !== "application/json") {
      return res.status(400).json({
        error: "Content-Type must be application/jsonn",
        requestId: req.requestId,
      });
    }
    next();
  };
}

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.header({
    "X-Request-Id": req.requestId,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  });
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(contentTypeValidation());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", dogsRouter);// Do not remove this line

app.use((req, res) => {
  res.status(404).json({ 
    "error": "Route not found",
    "requestId": req.requestId,
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  res.status(statusCode).json({
    "error": statusCode === 500 ? "Internal Server Error" : err.message,
    "requestId": req.requestId
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;