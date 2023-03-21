require("dotenv").config()
const express = require("express")
const app = express()

const cors = require('cors')

app.use (cors())
app.use(express.json());

const morgan = require('morgan');
app.use(morgan('dev'));

app.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

app.get('/', (req, res) => {
  res.redirect('/docs');
});

const apiRouter = require('./api');
app.use('/api', apiRouter);



const  client  = require('./db/client');
client.connect();

// 404 handler
app.get("*", (req, res) => {
  res.status(404).send({
    name: "404 - Not Found",
    message: "No route found for the requested URL",
  });
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  console.log("HELLO")
  if (res.statusCode < 400) res.status(500);
  res.send({ name: error.name, message: error.message });
});

// 404 handler
app.get("*", (req, res) => {
  res.status(404).send({
    name: "404 - Not Found",
    message: "No route found for the requested URL",
  });
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  if (res.statusCode < 400) res.status(500);
  res.send({ name: error.name, message: error.message });
});

module.exports = app;
