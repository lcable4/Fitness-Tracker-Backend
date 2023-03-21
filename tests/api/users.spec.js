/* 

DO NOT CHANGE THIS FILE

*/
require("dotenv").config();
const axios = require("axios");
const faker = require("faker");
const client = require("../../db/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { expectNotToBeError } = require("../expectHelpers");

const { JWT_SECRET = "neverTell" } = process.env;

const { SERVER_ADDRESS = "http://localhost:", PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

const {
  getPublicRoutinesByUser,
  getAllRoutinesByUser,
  getUserById,
} = require("../../db");

describe("/api/users", () => {
  let token, registeredUser;
  let newUser = { username: "robert", password: "bobbylong321" };
  let newUserShortPassword = { username: "robertShort", password: "bobby21" };
  
  describe("POST /api/users/register", () => {
    let tooShortSuccess, tooShortResponse;

    beforeAll(async () => {
      const successResponse = await axios.post(
        `${API_URL}/api/users/register`,
        newUser
      );
      registeredUser = successResponse.data.user;
      try {
        tooShortSuccess = await axios.post(
          `${API_URL}/api/users/register`,
          newUserShortPassword
        );
      } catch (err) {
        tooShortResponse = err.response;
      }
    });

    it("Creates a new user.", async () => {
      // Create some fake user data
      const fakeUserData = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };

      const { data } = await axios.post(
        `${API_URL}/api/users/register`,
        fakeUserData
      );

      expectNotToBeError(data);

      expect(data).toMatchObject({
        message: expect.any(String),
        token: expect.any(String),
        user: {
          id: expect.any(Number),
          username: fakeUserData.username,
        },
      });
    });

    it("EXTRA CREDIT: Hashes password before saving user to DB.", async () => {
      // Create some fake user data
      const fakeUserData = {
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };

      // Create the user through the API
      const { data } = await axios.post(
        `${API_URL}/api/users/register`,
        fakeUserData
      );

      expectNotToBeError(data);

      // Grab the user from the DB manually so we can
      // get the hashed password and check it
      const {
        rows: [user],
      } = await client.query(
        `
          SELECT *
          FROM users
          WHERE id = $1;
        `,
        [data.user.id]
      );

      const hashedPassword = user.password;

      // The original password and the hashedPassword shouldn't be the same
      expect(fakeUserData.password).not.toBe(hashedPassword);
      // Bcrypt.compare should return true.
      expect(await bcrypt.compare(fakeUserData.password, hashedPassword)).toBe(
        true
      );
    });

    it("Throws errors for duplicate username", async () => {
      let duplicateSuccess, duplicateErrResp;
      try {
        duplicateSuccess = await axios.post(
          `${API_URL}/api/users/register`,
          newUser
        );
      } catch (err) {
        duplicateErrResp = err.response;
      }
      expect(duplicateSuccess).toBeFalsy();
      expect(duplicateErrResp.data).toBeTruthy();
    });

    it("Throws errors for password-too-short.", async () => {
      expect(tooShortSuccess).toBeFalsy();
      expect(tooShortResponse.data).toBeTruthy();
    });
  });

  describe("POST /api/users/login", () => {
    it("Logs in the user. Requires username and password, and verifies that hashed login password matches the saved hashed password.", async () => {
      const { data } = await axios.post(`${API_URL}/api/users/login`, newUser);
      token = data.token;
      expect(data.token).toBeTruthy();
    });
    it("Returns a JSON Web Token. Stores the id and username in the token.", async () => {
      const parsedToken = jwt.verify(token, JWT_SECRET);
      expect(parsedToken.id).toEqual(registeredUser.id);
      expect(parsedToken.username).toEqual(registeredUser.username);
    });
  });

  describe("GET /api/users/me", () => {
    it("sends back users data if valid token is supplied in header", async () => {
      const { data } = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(data.username).toBeTruthy();
      expect(data.username).toBe(registeredUser.username);
    });
    it("rejects requests with no valid token", async () => {
      let noTokenResp, noTokenErrResp;
      try {
        noTokenResp = await axios.get(`${API_URL}/api/users/me`);
      } catch (err) {
        noTokenErrResp = err.response;
      }
      expect(noTokenResp).toBeFalsy();
      expect(noTokenErrResp.data).toBeTruthy();
    });
  });

  describe("GET /api/users/:username/routines", () => {
    it("Gets a list of public routines for a particular user.", async () => {
      const userId = 2;
      const userWithRoutines = await getUserById(userId);
      const { data: routines } = await axios.get(
        `${API_URL}/api/users/${userWithRoutines.username}/routines`
      );
      const routinesFromDB = await getPublicRoutinesByUser(userWithRoutines);
      expect(routines).toBeTruthy();
      expect(routines).toEqual(routinesFromDB);
    });

    it("gets a list of all routines for the logged in user", async () => {
      const { data } = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data: routines } = await axios.get(
        `${API_URL}/api/users/${data.username}/routines`
      );
      const routinesFromDB = await getAllRoutinesByUser(data);
      expect(routines).toBeTruthy();
      expect(routines).toEqual(routinesFromDB);
    });
  });
});
