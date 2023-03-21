const http = require("http")
const app = require("./app")


//CHANGE PORT BACK TO 3000
const { PORT = 3000 } = process.env;
const server = http.createServer(app)

server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});


