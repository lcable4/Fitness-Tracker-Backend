const client = require('./client');
// *** addActivityToRoutine() from routine_activities.js needs to be completed before you can pass the tests in this file. 
const { attachActivitiesToRoutines } = require('./activities');

// Work on this file FOURTH


// create and returns the new routine
// ** this function needs to be completed first because other tests rely on it. 
async function createRoutine({creatorId, isPublic, name, goal}) {
  try {
    const {
      rows: [routine],
    } = await client.query(
      `
      INSERT INTO routines("creatorId", "isPublic", name, goal)
      VALUES ($1, $2, $3, $4)
      RETURNING * ;
    `,
      [creatorId, isPublic, name, goal]
    );
    return routine;
  } catch (error) {
    throw error;
  }
}

// this function returns an array of all of the routines with their activities attached. Use the helper function attachActivitiesToRoutines() from "db/activities" to help with this. 

async function getAllRoutines() {
  try {
    const { rows } = await client.query(
      `
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE "isPublic" = true OR "isPublic" = false;
      `
    );
    const routinesWithActivities = await attachActivitiesToRoutines(rows);
    return routinesWithActivities.map(({ id, creatorId, creatorName, name, activities, isPublic, goal}) => ({ id, creatorId, creatorName, name, activities, isPublic, goal }));
  } catch (error) {
    // console.log(error);
    throw error;
  }
}



// this function returns an array of all of the public routines with their activities attached. Use the helper function attachActivitiesToRoutines() from "db/activities" to help with this. 

async function getAllPublicRoutines() {
  try {
    const { rows } = await client.query (
      `
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE "isPublic" = true
      `
    );
    const routinesWithActivities = await attachActivitiesToRoutines(rows)
    return routinesWithActivities.map(({ id, creatorId, creatorName, name, activities, isPublic, goal}) => ({ id, creatorId, creatorName, name, activities, isPublic, goal }));
  } catch (error) {
    // console.log(error)
  }
}



// this function should return a single routine (object) from the database that matches the id that is passed in as an argument. 
async function getRoutineById(id){
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE id = $1;
      `,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }
    if (!id) {
      return null;
    }
    const routine = rows[0];
    return routine;
  } catch (error) {
    // console.log(error)
    throw error;
  }
}



// this function returns an array of all of the routines WITHOUT their activities attached.
async function getRoutinesWithoutActivities({id, creatorId, isPublic, name, goal} = {}) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM routines
      WHERE ($1::integer IS NULL OR "creatorId" = $1) AND
            ($2::text IS NULL OR "name" = $2) AND
            ($3::text IS NULL OR "goal" = $3);
      `,
      [creatorId, name, goal]
    );
    return rows.map(({id, creatorId, name, isPublic, goal}) => ({ id, creatorId, name, isPublic, goal }));
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// this function should return an array of routines, with their activities attached, where the creatorName matches the name that is passed in as part of the argument. Use the helper function attachActivitiesToRoutines() from "db/activities" to help with this. 
async function getAllRoutinesByUser({username}) {
  try {
    const { rows } = await client.query (
      `
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE ("isPublic" = true OR "isPublic" = false) AND users.username = $1;
      `,
      [username]
    );
    const routinesWithActivities = await attachActivitiesToRoutines(rows)
    return routinesWithActivities.map(({ id, creatorId, creatorName, name, activities, isPublic, goal}) => ({ id, creatorId, creatorName, name, activities, isPublic, goal }));
  } catch (error) {
    // console.log(error)
  }
}



// this function should return an array of all public routines, with their activities attached, where the creatorName matches the name that is passed in as part of the argument. Use the helper function attachActivitiesToRoutines() from "db/activities" to help with this. 
async function getPublicRoutinesByUser({username}) {
  try {
    const { rows } = await client.query (
      `
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      WHERE "isPublic" = true
      `
    );
    const routinesWithActivities = await attachActivitiesToRoutines(rows)
    return routinesWithActivities.map(({ id, creatorId, creatorName, name, activities, isPublic, goal}) => ({ id, creatorId, creatorName, name, activities, isPublic, goal }));
  } catch (error) {
    // console.log(error)
  }
}



// this function should return an array of all routines, with their activities attached, contain the activity id that is passed in as part of the argument. Use the helper function attachActivitiesToRoutines() from "db/activities" to help with this. 
async function getPublicRoutinesByActivity({ id }) {
  try {
    const { rows } = await client.query(
      `
      SELECT routines.*, users.username AS "creatorName"
      FROM routines
      JOIN users ON routines."creatorId" = users.id
      JOIN routine_activities ON routine_activities."routineId" = routines.id
      WHERE routines."isPublic" = true
        AND routine_activities."activityId" = $1
      `,
      [id]
    );
    const routinesWithActivities = await attachActivitiesToRoutines(rows);
    return routinesWithActivities.map(({ id, creatorId, creatorName, name, activities, isPublic, goal }) => ({ id, creatorId, creatorName, name, activities, isPublic, goal }));
  } catch (error) {
    console.error(error);
    throw error;
  }
}



// The id should not be changed
// You should be able to update the name, or the goal, or the isPublic status, or any combination of these three. 
// return the updated routine
async function updateRoutine({ id, name, goal, isPublic }) {
  const setCols = [];
  const values = [];

  // Add the fields that were passed in to the SET clause and values array
  if (name) {
    setCols.push(`name=$${values.length + 1}`);
    values.push(name);
  }

  if (goal) {
    setCols.push(`goal=$${values.length + 1}`);
    values.push(goal);
  }

  if (isPublic !== undefined) {
    setCols.push(`"isPublic"=$${values.length + 1}`);
    values.push(isPublic);
  }

  if (setCols.length === 0) {
    // No fields were passed in, so there's nothing to update
    return;
  }

  const setString = setCols.join(", ");
  
  const {
    rows: [routine],
  } = await client.query(
    `
      UPDATE routines
      SET ${setString}
      WHERE id=$${values.length + 1}
      RETURNING *;
    `,
    [...values, id]
  );

  return routine;
}


// this should remove a routine from the database based upon the id that is passed in as an argument
// Make sure to delete all the routine_activities whose routine is the one being deleted.
// you do not need to return anything
async function destroyRoutine(id) {
  try {
    await client.query (
      `
      DELETE FROM routine_activities
      WHERE "routineId" = $1;
      `, [id]
    )
    const {
      rows
    }= await client.query(`
    DELETE FROM routines
    WHERE id = $1
    RETURNING *;
  `, [id]
  );
  return rows[0]
  } catch (error) {
    // console.log(error)
    throw error
  }
}



module.exports = {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getAllRoutinesByUser,
  getPublicRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine,
}