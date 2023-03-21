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
  createUser,
  createRoutine,
  getPublicRoutinesByActivity,
  getAllPublicRoutines,
} = require("../../db");

xdescribe("/api/activities", () => {
  let thisActivityDoesNotExistError;
  let thisActivityAlreadyExists;
  let token;

  const userToCreate = {
    username: "Vertigo",
    password: "LookIntoTheEyes",
  };

  const routineToCreate = {
    creatorId: 0,
    isPublic: true,
    name: "buff it up",
    goal: "lets get fit",
  };

  const routineActivityToCreateAndUpdate = {
    routineId: 0,
    activityId: 0,
    count: 20,
    duration: 300,
  };

  const activityToCreate = {
    name: "dead lift",
    description: "perfect form is the goal",
  };

  const activityToCreateAndThenUpdate = {
    name: "curling",
    description: "it occurs on ice",
  };

  beforeAll(async () => {
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
    await addActivityToRoutine(routineActivityToCreateAndUpdate);
  });

  xdescribe("GET /api/activities", () => {
    it("Just returns a list of all activities in the database", async () => {
      // Create a fake activity to watch for
      const curls = { name: "curls", description: "4 sets of 15." };
      const createdActivity = await createActivity(curls);
      const { data: activities } = await axios.get(`${API_URL}/api/activities`);
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
      expect(activities[0].name).toBeTruthy();
      expect(activities[0].description).toBeTruthy();
      const [filteredActivity] = activities.filter(
        (activity) => activity.id === createdActivity.id
      );
      expect(filteredActivity.name).toEqual(curls.name);
      expect(filteredActivity.description).toEqual(curls.description);
    });
  });

  xdescribe("GET /api/activities/:activityId/routines", () => {
    beforeAll(async () => {
      try {
        await axios.get(`${API_URL}/api/activities/10000/routines`);
      } catch (err) {
        thisActivityDoesNotExistError = err.response.data;
      }
    });
    it("Get a list of all public routines which feature that activity", async () => {
      const [testRoutine] = await getAllPublicRoutines();
      const [testActivity] = testRoutine.activities;
      const { data: routines } = await axios.get(
        `${API_URL}/api/activities/${testActivity.id}/routines`
      );
      const routinesFromDB = await getPublicRoutinesByActivity(testActivity);
      expect(routines).toEqual(routinesFromDB);
    });

    it("Should return an error when you ask for an activity that does not exist", async () => {
      expect(thisActivityDoesNotExistError).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  xdescribe("POST /api/activities", () => {
    const activityToTestDuplicateErrorHandling = {
      name: "pull ups are very useful",
      description: "they take time and consistent effort to improve",
    };

    beforeAll(async () => {
      // this is to create the activity
      try {
        await axios.post(
          `${API_URL}/api/activities`,
          activityToTestDuplicateErrorHandling,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        thisActivityAlreadyExists = err.response.data;
      }
    });

    beforeAll(async () => {
      // this is to try and create a duplicate activity and to save the error in a variable to be used below in the test
      try {
        await axios.post(
          `${API_URL}/api/activities`,
          activityToTestDuplicateErrorHandling,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        thisActivityAlreadyExists = err.response.data;
      }
    });

    it("Creates a new activity", async () => {
      const activityToCreateAndUpdate = {
        name: "jump rope like a boxer",
        description: "it is great cardio",
      };

      const { data: respondedActivity } = await axios.post(
        `${API_URL}/api/activities`,
        activityToCreateAndUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(respondedActivity.name).toEqual(activityToCreateAndUpdate.name);
      expect(respondedActivity.description).toEqual(
        activityToCreateAndUpdate.description
      );
    });

    it("responds with an error when a activity already exists with the same name", async () => {
      expect(thisActivityAlreadyExists).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });

  xdescribe("PATCH /api/activities/:activityId", () => {
    let createdActivityToBePatched;
    let errorForWhenAnActivityDoesNotExist;
    let dataForActivityThatWillBeUsedToCheckTheErrorHandling;
    let errorForWhenThePatchAttemptsToChangeTheNameToOneThatExists;

    beforeAll(async () => {
      // this is to create the activity that we will then attempt to update

      const { data } = await axios.post(
        `${API_URL}/api/activities`,
        activityToCreateAndThenUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      createdActivityToBePatched = data;
    });

    beforeAll(async () => {
      // this attempt to patch an activity that does not exist. This should throw an error which we will hold in a variable and test below

      const activityThatShouldNotExist = {
        name: "sedentary behavior",
        description: "moving is good",
      };
      try {
        const { data } = await axios.patch(
          `${API_URL}/api/activities/${424242424242}`,
          activityThatShouldNotExist,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        createdActivityToBePatched = data;
      } catch (err) {
        errorForWhenAnActivityDoesNotExist = err.response.data;
      }
    });

    beforeAll(async () => {
      // this create an activity that we will use in the next beforeAll
      const aNewActivityToUseAsATest = {
        name: "Boat",
        description: "Deceptively challenging",
      };

      const { data } = await axios.post(
        `${API_URL}/api/activities`,
        aNewActivityToUseAsATest,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dataForActivityThatWillBeUsedToCheckTheErrorHandling = data;
    });

    beforeAll(async () => {
      // this will attempt to patch an activity and change the name to one that already exists. This should throw an error which we will hold in a variable and test below

      const patchData = {
        name: dataForActivityThatWillBeUsedToCheckTheErrorHandling.name,
        description: "change can be good",
      };
      try {
        await axios.patch(
          `${API_URL}/api/activities/${createdActivityToBePatched.id}`,
          patchData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        errorForWhenThePatchAttemptsToChangeTheNameToOneThatExists =
          err.response.data;
      }
    });

    it("Anyone can update an activity", async () => {
      const newActivityData = {
        name: "Double Bicep Curls",
        description: "They hurt EVEN MORE, but you will thank you later",
      };
      const { data: respondedActivity } = await axios.patch(
        `${API_URL}/api/activities/${createdActivityToBePatched.id}`,
        newActivityData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(respondedActivity.name).toEqual(newActivityData.name);
      expect(respondedActivity.description).toEqual(
        newActivityData.description
      );
    });

    it("returns an error when updating an activity that does not exist", async () => {
      expect(errorForWhenAnActivityDoesNotExist).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });

    it("returns an error when changing an activity to have the name of an existing activity", async () => {
      expect(
        errorForWhenThePatchAttemptsToChangeTheNameToOneThatExists
      ).toMatchObject({
        message: expect.any(String),
        name: expect.any(String),
      });
    });
  });
});
