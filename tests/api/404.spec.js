/* 

DO NOT CHANGE THIS FILE

*/
require("dotenv").config();

const axios = require("axios");

const { SERVER_ADDRESS = "http://localhost:", PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

xdescribe("/api/unknown", () => {
  let errorMessageFor404Error;
  let errorNameFor404Error;
  let errorStatusFor404Error;

  beforeAll(async () => {
    try {
      await axios.get(`${API_URL}/api/unknown`);
    } catch (err) {
      // the 404 response returns an object with a message, nae and status properties
      errorNameFor404Error = err.response.data.name;
      errorMessageFor404Error = err.response.data.message;
      errorStatusFor404Error = err.response.status;
    }
  });
 
  it("should return a 404",  (done) => {
    expect(errorStatusFor404Error).toEqual(404);
    expect(typeof errorNameFor404Error).toEqual("string");
    expect(typeof errorMessageFor404Error).toEqual("string");
    done()
  });
});
