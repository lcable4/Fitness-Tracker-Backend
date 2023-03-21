/* 

DO NOT CHANGE THIS FILE

*/

require("dotenv").config();

const axios = require("axios");
const { SERVER_ADDRESS = "http://localhost:", PORT = 3000 } = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

const {
  addActivityToRoutine, //
  createActivity, //
  createRoutine,
  createUser,
  getAllPublicRoutines,
  getRoutineById,
  getAllRoutinesByUser,
} = require("../../db");

describe("/api/routines", () => {
  let theUserNeedsToBeLoggedInError;
  let token;

  const userToCreate = {
    username: "Miranda",
    password: "Fireflys",
  };

  const routineToCreate = {
    creatorId: 0,
    isPublic: true,
    name: "rock climbing",
    goal: "lets climb the wall",
  };

  const routineActivityToCreateAndUpdate = {
    routineId: 0,
    activityId: 0,
    count: 20,
    duration: 300,
  };

  const activityToCreate = {
    name: "dead lift2",
    description: "perfect form is the goal",
  };

  beforeAll(async () => {
    try {
      // creates a user
      // console.log(userToCreate, "USERTOCREATELOG")
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
      await addActivityToRoutine(routineActivityToCreateAndUpdate);
    } catch (err) {
    //   console.log(err, "????????????");
    }
  });
  describe("GET /api/routines", () => {
    it("Returns a list of public routines, includes the activities with them", async () => {
      const publicRoutinesFromDB = await getAllPublicRoutines();

      const { data: publicRoutinesFromAPI } = await axios.get(
        `${API_URL}/api/routines`
      );
      expect(publicRoutinesFromAPI).toEqual(publicRoutinesFromDB);
    });
  });

  describe("POST /api/routines", () => {
    beforeAll(async () => {
      try {
        const newRoutineToCreate = {
          creatorId: 40000,
          isPublic: true,
          name: "just another workout",
          goal: "time to change it up",
        };

        await axios.post(`${API_URL}/api/routines`, newRoutineToCreate, {
          headers: { Authorization: `Bearer thisIsAFakeToken` },
        });
      } catch (err) {
        theUserNeedsToBeLoggedInError = err.response.data;
      }
    });

    it("Creates a new routine, with the creatorId matching the logged in user", async () => {
      const newRoutineToCreate = {
        creatorId: 0,
        isPublic: true,
        name: "workout like a boxer",
        goal: "to be flow like a butterfly",
      };

      const { data: respondedRoutine } = await axios.post(
        `${API_URL}/api/routines`,
        newRoutineToCreate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(respondedRoutine.name).toEqual(newRoutineToCreate.name);
      expect(respondedRoutine.description).toEqual(
        newRoutineToCreate.description
      );
    });

    it("Requires logged in user", async () => {
      expect(theUserNeedsToBeLoggedInError).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  describe("PATCH /api/routines/:routineId", () => {
    let newRoutineForTesting;
    let errorForNotBeingAuthorized;
    let errorForTryingToEditARoutineThatIsNotYours;

    beforeAll(async () => {
      try {
        //create a new routine that will be used for testing PATCH
        const newRoutineToCreate = {
          creatorId: 40000,
          isPublic: true,
          name: "lets go sprinting today",
          goal: "to increase our need for speed",
        };

        const { data } = await axios.post(
          `${API_URL}/api/routines`,
          newRoutineToCreate,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        newRoutineForTesting = data;
      } catch (err) {
        // console.log(err, "##############");
      }
    });

    beforeAll(async () => {
      try {
        const dataForPatchingRoutine = {
          isPublic: false,
          name: "running out of names",
          goal: "go faster",
        };

        // this generates an error because we are not sending in a token. This error will be used in the below test for patch: "Requires logged in user"
        await axios.patch(
          `${API_URL}/api/routines/${newRoutineForTesting.id}`,
          dataForPatchingRoutine,
          {
            headers: { Authorization: `Bearer thisIsAFakeToken` },
          }
        );
      } catch (err) {
        errorForNotBeingAuthorized = err.response.data;
      }
    });

    beforeAll(async () => {
      try {
        //creating a second user
        const secondUserData = {
          username: "Mal",
          password: "Serenity",
        };
        const secondUser = await createUser(secondUserData);
        let secondUserToken;

        const { data } = await axios.post(
          `${API_URL}/api/users/login`,
          secondUserData
        );

        // getting the token for the second user
        secondUserToken = data.token;

        const newRoutineToCreate = {
          creatorId: secondUser.id,
          isPublic: true,
          name: "exercises to help fly a space ship",
          goal: "to fly a ship",
        };

        newDataForPatchingRoutine = {
          name: "exercises to help fly a space ship better",
          goal: "to fly a ship without crashing",
        };

        // Create a routine so we can attempt to update it. Using the secondUserToken
        const { data: respondedRoutine } = await axios.post(
          `${API_URL}/api/routines`,
          newRoutineToCreate,
          { headers: { Authorization: `Bearer ${secondUserToken}` } }
        );

        // Attempt to patch a routine made with the secondUserToken, while passing in the token from the first user we made. This should throw an error which we are attempting to capture in the catch.
        await axios.patch(
          `${API_URL}/api/routines/${respondedRoutine.id}`,
          newDataForPatchingRoutine,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        errorForTryingToEditARoutineThatIsNotYours = err.response.data;
      }
    });

    it("Updates a routine, notably changing public/private, the name, and the goal", async () => {
      const newRoutineToCreate = {
        creatorId: 0,
        isPublic: true,
        name: "back to basics",
        goal: "body weight exercises",
      };

      // Create a routine so we can update it.
      const { data: respondedRoutine } = await axios.post(
        `${API_URL}/api/routines`,
        newRoutineToCreate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updateRoutineData = {
        isPublic: false,
        name: "Every other day",
        goal: "Until I lose 10 lbs.",
      };

      const { data } = await axios.patch(
        `${API_URL}/api/routines/${respondedRoutine.id}`,
        updateRoutineData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(data).toMatchObject(updateRoutineData);
    });

    it("Requires logged in user", async () => {
      expect(errorForNotBeingAuthorized).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });

    it("returns a 403 when a user tries to edit a routine that is not theirs", async () => {
      console.log(errorForTryingToEditARoutineThatIsNotYours, "0000000")
      expect(errorForTryingToEditARoutineThatIsNotYours).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  describe("DELETE /api/routines/:routineId", () => {
    let errorForTryingToDeleteARoutineThatIsNotYours;

    beforeAll(async () => {
      try {
        //creating a second user
        const secondUserData = {
          username: "Jane",
          password: "Verajjjjjjddd",
        };
        const secondUser = await createUser(secondUserData);
        let secondUserToken;

        const { data } = await axios.post(
          `${API_URL}/api/users/login`,
          secondUserData
        );

        // getting the token for the second user
        secondUserToken = data.token;

        const newRoutineToCreate = {
          creatorId: secondUser.id,
          isPublic: true,
          name: "working out on a space ship",
          goal: "what happens if the ship rolls??",
        };

        // Create a routine so we can attempt to update it. Using the secondUserToken
        const { data: respondedRoutine } = await axios.post(
          `${API_URL}/api/routines`,
          newRoutineToCreate,
          { headers: { Authorization: `Bearer ${secondUserToken}` } }
        );

        // Attempt to delete a routine made with the secondUserToken, while passing in the token from the first user we made. This should throw an error which we are attempting to capture in the catch.
        await axios.delete(`${API_URL}/api/routines/${respondedRoutine.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        errorForTryingToDeleteARoutineThatIsNotYours = err.response.data;
      }
    });

    it("Hard deletes a routine. Makes sure to delete all the routineActivities whose routine is the one being deleted.", async () => {
      // Create a routine so we can delete it

      const newRoutineToCreateToBeDeleted = {
        creatorId: 0,
        isPublic: true,
        name: "Modern Dance",
        goal: "to learn to dance",
      };

      const { data: respondedRoutine } = await axios.post(
        `${API_URL}/api/routines`,
        newRoutineToCreateToBeDeleted,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { data: deletedRoutine } = await axios.delete(
        `${API_URL}/api/routines/${respondedRoutine.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const shouldBeDeleted = await getRoutineById(deletedRoutine.id);
      expect(deletedRoutine.id).toBe(respondedRoutine.id);
      expect(deletedRoutine.name).toBe(respondedRoutine.name);
      expect(deletedRoutine.goal).toBe(respondedRoutine.goal);
      expect(shouldBeDeleted).toBeFalsy();
    });

    it("returns a 403 when the user deletes a routine that isn't theirs", async () => {
      // console.log(errorForTryingToDeleteARoutineThatIsNotYours, "7777777777777")
      expect(errorForTryingToDeleteARoutineThatIsNotYours).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  describe("POST /api/routines/:routineId/activities", () => {
    let routineActivityThatWeCreated;
    let firstUserRoutine;
    let errorForTryingToAddAnActivityToARoutineThatIsNotYours;

    beforeAll(async () => {
      try {
        // get the user info
        const currentUserRoutines = await getAllRoutinesByUser(userToCreate);
        firstUserRoutine = currentUserRoutines[0];

        // create an activity data
        const newActivityToCreate = {
          name: "figure skating",
          description: "be graceful on the ice",
        };

        // create an activity in the database
        const { data: newlyCreatedActivity } = await axios.post(
          `${API_URL}/api/activities`,
          newActivityToCreate,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // create a routine activity
        const routineActivityToAddToARoutine = {
          routineId: firstUserRoutine.id,
          activityId: newlyCreatedActivity.id,
          count: 200,
          duration: 3000,
        };

        // add the routine activity to the database

        const { data: respondedRoutineActivity } = await axios.post(
          `${API_URL}/api/routines/${firstUserRoutine.id}/activities`,
          routineActivityToAddToARoutine,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        routineActivityThatWeCreated = respondedRoutineActivity;
      } catch (err) {
        // console.log(err, "&&&&&");
      }
    });

    beforeAll(async () => {
      // using the routine activity that we added to our user in the above before all.  We will attempt to add the same routine activity again, which should throw an error.  We will capture this error and test it below.

      try {
        const { data } = await axios.post(
          `${API_URL}/api/routines/${firstUserRoutine.id}/activities`,
          routineActivityThatWeCreated,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // console.log(data);
      } catch (err) {
        errorForTryingToAddAnActivityToARoutineThatIsNotYours =
          err.response.data;
      }
    });

    it("Attaches a single activity to a routine.", async () => {
      const currentUserRoutines = await getAllRoutinesByUser(userToCreate);
      const firstUserRoutine = currentUserRoutines[0];

      const newActivityToCreate = {
        name: "ice skating",
        description: "be one with the ice",
      };

      const { data: newlyCreatedActivity } = await axios.post(
        `${API_URL}/api/activities`,
        newActivityToCreate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const routineActivityToAddToARoutine = {
        routineId: firstUserRoutine.id,
        activityId: newlyCreatedActivity.id,
        count: 20,
        duration: 300,
      };

      const { data: respondedRoutineActivity } = await axios.post(
        `${API_URL}/api/routines/${firstUserRoutine.id}/activities`,
        routineActivityToAddToARoutine,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(respondedRoutineActivity).toMatchObject(
        routineActivityToAddToARoutine
      );
    });

    it("Prevents duplication on (routineId, activityId) pair.", async () => {
      expect(
        errorForTryingToAddAnActivityToARoutineThatIsNotYours
      ).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });
});
