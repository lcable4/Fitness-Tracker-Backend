/* 

DO NOT CHANGE THIS FILE

*/
require("dotenv").config()
const { default: axios } = require("axios");
require("../../db/client");
const app = require("../../app");
const { SERVER_ADDRESS = 'http://localhost:', PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

describe("/api/health", () => {

  it('responds to a request at /api/health with a message specifying it is healthy', async () => {
    const res = await axios.get(`${API_URL}/api/health`);
    expect(typeof res.data.message).toEqual('string');
  });

})
