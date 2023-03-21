const express = require("express");
const { requireUser } = require("./utils");
const router = express.Router();
const {
  getAllPublicRoutines,
  createRoutine,
  updateRoutine,
  getRoutineById,
  destroyRoutine,
  addActivityToRoutine,
  getRoutineActivitiesByRoutine,
  getRoutineActivityById,
} = require("../db");
;

// GET /api/routines
router.get("/", async (req, res, next) => {
  try {
    const result = await getAllPublicRoutines();
    res.send(result);
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// POST /api/routines
router.post("/", requireUser, async (req, res, next) => {

  const { isPublic, name, goal } = req.body;
  const creatorId = req.user.id;
  const data = {
    authorId: req.user.id,
    creatorId,
    isPublic,
    name,
    goal,
  };

  try {
    const post = await createRoutine(data);
    if (post) {
      res.send(post);
    } else {
      next({ name: "Post Error", message: "Error creating post." });
    }
  } catch ({ name, message }) {
    next({
      name,
      message: `A routine with name ${data.name} already exists`,
    });
  }
});
// PATCH /api/routines/:routineId
router.patch("/:id", requireUser, async (req, res, next) => {
  try {
    const data = req.body;
    const { id } = req.params;
    data.id = id;
    const routine = await getRoutineById(id);
    if (routine.creatorId === req.user.id) {
      const result = await updateRoutine(data);
      res.send(data);
    } else {
      next({
        name: "Update Error",
        message: "Cannot edit another user's routine.",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

  
// DELETE /api/routines/:routineId
router.delete("/:routineId", requireUser, async (req, res, next) => {
  try {
    const { routineId } = req.params;
    const routine = await getRoutineById(routineId);
    // console.log(routine, "ROUTINE LOG")
    // console.log(req.user, "REQ USER LOG")
    if (!routine) {
      next({
        name: "Error",
        message: "Routine does not exist!",
      });
    } else if (routine.creatorId !== req.user.id) {
      // console.log("HERE")
      res.status(403);
      next({
        name: "Delete Error",
        message: "This Post does not belong to you.",
      });
      
    } else {
      const destroyedRoutine = await destroyRoutine(routineId);
      // console.log(destroyedRoutine, "33333333")
      res.send(destroyedRoutine);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// POST /api/routines/:routineId/activities
router.post("/:routineId/activities", async (req, res, next) => {
  try {
    const { routineId } = req.params;
    const { activityId, count, duration } = req.body;
    // console.log(req, "REQ LOG")
    const routine = await getRoutineById(routineId);
    // console.log(routine, "ROUTINE LOG")
    
    if (!routine) {
      return next({
        name: "Routine Not Found",
        message: "Routine does not exist",
      });
    }

    if (routine.creatorId !== req.user.id) {
      return next({
        error: "Unauthorized",
        message: "Not authorized"
      });
    }

    const routineActivities = await getRoutineActivitiesByRoutine(routine)
    let activityExists = false;
    // console.log(routineActivities, "ROUTINE ACTIVITIES")

    routineActivities.forEach((idx) => {
      // console.log(req.body.activityId, "IDX LOG")
      if(idx.activityId === req.body.activityId) {
        activityExists = true;
        return
      }
    })

    if (activityExists) {
      next({
        name: "Duplicate Routine Activity Error",
        message: `Activity ID ${req.body.activityId} already exists in Routine ID ${routineId}`,
      });
    } else {
      const newData = {
        routineId,
        activityId: req.body.activityId,
        count: req.body.count,
        duration: req.body.duration,
      }
      const newActivity = await addActivityToRoutine(newData);
      // console.log(newActivity, "NEW ACTIVITY LOG")
      if(!newActivity){
        next({
          name: "No activity",
          message: "unauthorized"
        })
      }
      res.send(newActivity);
    }

  } catch (error) {
    next(error);
  }
});
module.exports = router;