/* 

DO NOT CHANGE THIS FILE

*/

require("dotenv").config();

const client = require("../../db/client");

const {
  getAllActivities,
  createActivity,
  updateActivity,
  getActivityById,
  getActivityByName,
} = require("../../db");

describe("DB Activities", () => {
  describe("createActivity({ name, description })", () => {
    it("Creates and returns the new activity (object)", async () => {
      const activityToCreate = {
        name: "Marathon",
        description: "Run all the miles",
      };
      const fakeActivity = await createActivity(activityToCreate);

      expect(fakeActivity.name).toBe(activityToCreate.name);
      expect(fakeActivity.description).toBe(activityToCreate.description);
    });
  });

  describe("getAllActivities()", () => {
    it("selects and returns an array of all activities", async () => {
      const activityToCreate = { name: "Sit ups", description: "Do 100 reps" };

      await createActivity(activityToCreate);
      const activities = await getAllActivities();
      const { rows: activitiesFromDatabase } = await client.query(`
        SELECT * FROM activities;
      `);
      expect(activities).toEqual(activitiesFromDatabase);
    });
  });

  describe("getActivityByName(activityName)", () => {
    it("gets an activity by xit's name", async () => {
      const activityToCreate = {
        name: "Power Walking",
        description: "At the mall",
      };
      const fakeActivity = await createActivity(activityToCreate);
      const activity = await getActivityByName(fakeActivity.name);
      expect(activity.id).toEqual(fakeActivity.id);
    });
  });

  describe("getActivityById(activityId)", () => {
    it("gets activities by their id", async () => {
      const activityToCreate = { name: "Crunches", description: "Do 40 reps" };
      const fakeActivity = await createActivity(activityToCreate);

      const activity = await getActivityById(fakeActivity.id);

      expect(activity.id).toEqual(fakeActivity.id);
      expect(activity.name).toEqual(fakeActivity.name);
      expect(activity.description).toEqual(fakeActivity.description);
    });
  });

  describe("updateActivity", () => {
    it("Updates name without affecting the ID. Returns the updated Activity.", async () => {
      const activityToCreate = {
        name: "Baseball",
        description: "Run the bases",
      };

      const fakeActivity = await createActivity(activityToCreate);
      const name = "Softball";
      const updatedActivity = await updateActivity({
        id: fakeActivity.id,
        name,
      });
      expect(updatedActivity.id).toEqual(fakeActivity.id);
      expect(updatedActivity.name).toEqual(name);
      expect(updatedActivity.description).toEqual(fakeActivity.description);
    });

    it("Updates description without affecting the ID. Returns the updated Activity.", async () => {
      const activityToCreate = { name: "Soccer", description: "After school" };

      const fakeActivity = await createActivity(activityToCreate);
      const description = "Football is life!";
      const updatedActivity = await updateActivity({
        id: fakeActivity.id,
        description,
      });
      expect(updatedActivity.id).toEqual(fakeActivity.id);
      expect(updatedActivity.name).toEqual(fakeActivity.name);
      expect(updatedActivity.description).toEqual(description);
    });

    it("can update name and description without affecting the ID. Returns the updated Activity", async () => {
      const activityToCreate = {
        name: "Football",
        description: "so very boring",
      };

      const fakeActivity = await createActivity(activityToCreate);
      const description = "Way better than football!";
      const name = "Rugby";
      const updatedActivity = await updateActivity({
        id: fakeActivity.id,
        description,
        name,
      });
      expect(updatedActivity.id).toEqual(fakeActivity.id);
      expect(updatedActivity.name).toEqual(name);
      expect(updatedActivity.description).toEqual(description);
    });
  });
});
