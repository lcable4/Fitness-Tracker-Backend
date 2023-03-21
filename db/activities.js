const client = require("./client")

// Work on this file SECOND

// activities functions

// create and returns the new activity
// ** this function needs to be completed first because other tests rely on it. 
async function createActivity({ name, description }) {
  try {
    const { rows } = await client.query(
      `
      INSERT INTO activities(name, description)
      VALUES($1, $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `,
      [name, description]
    );
    return rows[0];
  } catch (error) {
    console.log(error)
  }
}



// this function returns an array of all of the activities
async function getAllActivities() {
  try {
    const { rows } = await client.query (
      `
      SELECT *
      FROM activities;
      `
      )
      return rows;
  } catch (error) {
    console.log(error)
    throw error
  }
}


// this function should return a single activity (object) from the database that matches the name that is passed in as an argument. 
async function getActivityByName(name) {
  try{
    const { rows } = await client.query (
      `
      SELECT *
      FROM activities
      WHERE name = $1;
      `,
      [name]
    )
    if (rows.length === 0) {
      return null;
    }

    const activity = rows[0];
    return activity;
  } catch (error) {
    console.log(error)
  }
}


// this function should return a single activity (object) from the database that matches the id that is passed in as an argument.
async function getActivityById(id) {
  try{
    const { rows } = await client.query (
      `
      SELECT *
      FROM activities
      WHERE id = $1;
      `,
      [id]
    )
    if (rows.length === 0) {
      return null;
    }

    const activity = rows[0];
    return activity;
  } catch (error) {
    console.log(error)
  }
}


// The id should not be changed
// You should be able to update the name, or the description, or name & description. 
// return the updated activity
async function updateActivity({ id, name, description }) {
  const setCols = [];
  const values = [];

  // Add the fields that were passed in to the SET clause and values array
  if (id) {
    setCols.push(`id=$${values.length + 1}`);
    values.push(id);
  }

  if (name) {
    setCols.push(`name=$${values.length + 1}`);
    values.push(name);
  }

  if (description !== undefined) {
    setCols.push(`description=$${values.length + 1}`);
    values.push(description);
  }

  if (setCols.length === 0) {
    // No fields were passed in, so there's nothing to update
    return;
  }

  const setString = setCols.join(", ");
  const {
    rows: [activities],
  } = await client.query(
    `
      UPDATE activities
      SET ${setString}
      WHERE id=$${values.length + 1}
      RETURNING *;
    `,
    [...values, id]
  );

  return activities;
}



// Do NOT modify the attachActivitiesToRoutines function.  You will need to use this function in your routines.js file whenever you need to attach activities to your routines. 
async function attachActivitiesToRoutines(routines) {
  // no side effects
  const routinesToReturn = [...routines];
  const binds = routines.map((_, index) => `$${index + 1}`).join(", ");
  const routineIds = routines.map((routine) => routine.id);
  if (!routineIds?.length) return [];

  try {
    // get the activities, JOIN with routine_activities (so we can get a routineId), and only those that have those routine ids on the routine_activities join
    const { rows: activities } = await client.query(
      `
      SELECT activities.*, routine_activities.duration, routine_activities.count, routine_activities.id AS "routineActivityId", routine_activities."routineId"
      FROM activities 
      JOIN routine_activities ON routine_activities."activityId" = activities.id
      WHERE routine_activities."routineId" IN (${binds});
    `,
      routineIds
    );

    // loop over the routines
    for (const routine of routinesToReturn) {
      // filter the activities to only include those that have this routineId
      const activitiesToAdd = activities.filter(
        (activity) => activity.routineId === routine.id
      );
      // attach the activities to each single routine
      routine.activities = activitiesToAdd;
    }
    return routinesToReturn;
  } catch (error) {
    throw error;
  }
}


module.exports = {
  getAllActivities,
  getActivityById,
  getActivityByName,
  createActivity,
  updateActivity,
  attachActivitiesToRoutines
}
