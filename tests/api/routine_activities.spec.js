/* 

DO NOT CHANGE THIS FILE

*/

require("dotenv").config();

const axios = require("axios");
const { SERVER_ADDRESS = "http://localhost:", PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

const {
  addActivityToRoutine,
  createActivity,
  createRoutine,
  createUser,
  getRoutineActivityById,
} = require("../../db");

describe("/api/routine_activities", () => {
  let token;
  let secondUserToken;
  let theUserNeedsToBeLoggedInToPatchError;
  let theUserNeedsToBeLoggedInToDeleteError;
  let routineActivityThatWasCreated;

  const userToCreate = {
    username: "Wash",
    password: "Flyingss",
  };

  const secondUserToCreate = {
    username: "Anara",
    password: "Flyingss",
  };

  const routineToCreate = {
    creatorId: 0,
    isPublic: true,
    name: "spartan training",
    goal: "lets climb the wall and then run",
  };

  const routineActivityToCreateAndUpdate = {
    routineId: 0,
    activityId: 0,
    count: 2,
    duration: 3,
  };

  const activityToCreate = {
    name: "farmer carry",
    description: "perfect for life on a farm",
  };

  beforeAll(async () => {
    try {
      // creates a user
      const newUser = await createUser(userToCreate);
      routineToCreate.creatorId = newUser.id;

      //login as the user to generate a token
      const { data } = await axios.post(
        `${API_URL}/api/users/login`,
        userToCreate
      );
      token = data.token;

      //creates an activity
      const newActivity = await createActivity(activityToCreate);

      //creates a routine that is attached to the above user
      const newRoutine = await createRoutine(routineToCreate);
      routineActivityToCreateAndUpdate.routineId = newRoutine.id;

      routineActivityToCreateAndUpdate.activityId = newActivity.id;

      // adds the newActivity to the above routine
      routineActivityThatWasCreated = await addActivityToRoutine(
        routineActivityToCreateAndUpdate
      );

      //creating a second user
      await createUser(secondUserToCreate);

      //login as the second user to generate a token
      const response = await axios.post(
        `${API_URL}/api/users/login`,
        secondUserToCreate
      );
      secondUserToken = response.data.token;
    } catch (err) {
      console.log(err);
    }
  });

  describe("PATCH /api/routine_activities/:routineActivityId", () => {
    beforeAll(async () => {
      try {
        const newRoutineActivityData = {
          count: 33,
          duration: 9,
        };

        const { data: respondedRoutineActivity } = await axios.patch(
          `${API_URL}/api/routine_activities/${routineActivityThatWasCreated.id}`,
          newRoutineActivityData,
          { headers: { Authorization: `Bearer ${secondUserToken}` } }
        );
      } catch (err) {
        theUserNeedsToBeLoggedInToPatchError = err.response.data;
      }
    });

    it("Updates the count or duration on the routine activity", async () => {
      const newRoutineActivityData = {
        count: 55,
        duration: 45,
      };
      const { data: respondedRoutineActivity } = await axios.patch(
        `${API_URL}/api/routine_activities/${routineActivityThatWasCreated.id}`,
        newRoutineActivityData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(respondedRoutineActivity.count).toEqual(
        newRoutineActivityData.count
      );
      expect(respondedRoutineActivity.duration).toEqual(
        newRoutineActivityData.duration
      );
    });

    it("should return an error if the owner of the routine isn't the one trying to edit it", async () => {
      expect(theUserNeedsToBeLoggedInToPatchError).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  describe("DELETE /api/routine_activities/:routineActivityId", () => {
    beforeAll(async () => {
      try {
        await axios.delete(
          `${API_URL}/api/routine_activities/${routineActivityThatWasCreated.id}`,
          { headers: { Authorization: `Bearer ${secondUserToken}` } }
        );
      } catch (err) {
        theUserNeedsToBeLoggedInToDeleteError = err.response.data;
      }
    });

    it("Removes an activity from a routine, uses hard delete", async () => {
      const newActivityToCreate = {
        name: "swimming",
        description: "just keep swimming",
      };

      //creates an activity
      const newActivity = await createActivity(newActivityToCreate);

      // data for a new routine
      const newRoutineData = {
        creatorId: routineToCreate.creatorId,
        isPublic: true,
        name: "triathlon training",
        goal: "all the exercises",
      };

      //creates a routine that is attached to the above user
      const newRoutine = await createRoutine(newRoutineData);

      const newRoutineActivityToCreateAndDestroy = {
        routineId: newRoutine.id,
        activityId: newActivity.id,
        count: 2,
        duration: 3,
      };
      // adds the newActivity to the above routine
      const newRoutineActivityThatWasCreated = await addActivityToRoutine(
        newRoutineActivityToCreateAndDestroy
      );

      const { data: deletedRoutineActivity } = await axios.delete(
        `${API_URL}/api/routine_activities/${newRoutineActivityThatWasCreated.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const shouldBeDeleted = await getRoutineActivityById(
        deletedRoutineActivity.id
      );

      expect(deletedRoutineActivity.id).toBe(
        newRoutineActivityThatWasCreated.id
      );
      expect(deletedRoutineActivity.count).toBe(
        newRoutineActivityThatWasCreated.count
      );
      expect(deletedRoutineActivity.duration).toBe(
        newRoutineActivityThatWasCreated.duration
      );
      expect(shouldBeDeleted).toBeFalsy();
    });

    it("Logged in user should be the owner of the modified object.", async () => {
      expect(theUserNeedsToBeLoggedInToDeleteError).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });
});
