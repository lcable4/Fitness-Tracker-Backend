const express = require("express");
const {
  getRoutineActivityById,
  getRoutineById,
  updateRoutineActivity,
  destroyRoutineActivity,
} = require("../db");
const routineActivitiesRouter = express.Router();
const { requireUser } = require("./utils");

// PATCH /api/routine_activities/:routineActivityId
routineActivitiesRouter.patch("/:routineActivityId", requireUser, async (req, res, next) => {
    console.log(req.body, "REQLOG")
    const { routineActivityId } = req.params;
    console.log(routineActivityId, "routineActivityIdLOG")
    const data = req.body;
  
  console.log(data, "DATA LOG")
 
  try {
    const routineActivity = await getRoutineActivityById(routineActivityId);
    console.log(routineActivity, "ROUTINE ACTIVITY")
    if(!routineActivity) {
        next({
            name: "Error not found",
            message: `Error ${routineActivity} not found`
        })
    } else {
        const routine = await getRoutineById(routineActivity.routineId);
        if (!routine) {
          next({
            name: "Error",
            message: "Error message",
          });
        } else if (routine.creatorId === req.user.id) {
          const result = await updateRoutineActivity({
            count: req.body.count,
            duration: req.body.duration,
            id: routineActivityId,
          });
          res.send(result);
        } else {
          next({
            name: "Not the owner",
            message: "You are not the owner",
          });
        }
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

// DELETE /api/routine_activities/:routineActivityId
routineActivitiesRouter.delete("/:id", requireUser, async (req, res, next) => {
  const { id } = req.params;
  try {
    const routineActivity = await getRoutineActivityById(id);
    const routine = await getRoutineById(routineActivity.routineId);
    if (!routine) {
    next({
        name: "Error",
        message: "Error finding routine",
    });
    } else if (routine.creatorId === req.user.id) {
    await destroyRoutineActivity(id);
    res.send(routineActivity);
    } else {
    next({
        name: "Not the owner",
        message: "You are not the owner",
    });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = routineActivitiesRouter;