const express = require('express');
const activitiesRouter = express.Router();
const {getAllActivities,
    getActivityById,
    createActivity,
    updateActivity,
    attachActivitiesToRoutines,
    getPublicRoutinesByActivity,
    getActivityByName
} = require('../db')

const { requireUser } = require('./utils')

// GET /api/activities
activitiesRouter.get("/", async (req, res) => { 
    try {
        const activities = await getAllActivities();
        res.send(activities);
      } catch (error) {
        next(error);
      }
});
// GET /api/activities/:activityId/routines
activitiesRouter.get("/:id/routines", async (req, res, next) => {
    try {
      const { id } = req.params;
      const routines = await getPublicRoutinesByActivity({ id });
      if (routines.length) {
        res.send(routines);
      } else {
        next({
          name: "ActivityDoesNotExistError",
          message: "This activity does not exist",
        });
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

// POST /api/activities
activitiesRouter.post("/", requireUser, async (req, res, next) => {          
    const { name, description } = req.body;
        console.log('step1')
        const data = {authorId: req.user.id, 
        name, description, }
    try{
        const post = await createActivity(data);
        if (post) {
            res.send(post)
        } else {
            next ({ name:"Posing error",
                    message:"Unable to create post"
        })
        }
    } catch ({ name, message}) {
        next({name:"Posing error",
        message:"Unable to create post" });
    }
});
// PATCH /api/activities/:activityId
activitiesRouter.patch("/:activityId", requireUser, async (req, res, next) => {
    try {
        const { activityId } = req.params;
        const getActivityId = await getActivityById(activityId);
        if (!getActivityId) {
          next({
            name: "not found",
            message: `Activity ${activityId} not found`,
          });
        } else {
          const { name, description } = req.body;
          try {
            const updatedActivity = await updateActivity({
              id: activityId,
              name,
              description,
            });
            res.send(updatedActivity);
          } catch (error) {
            next({
              name: "test",
              message: `An activity with name ${name} already exists`,
            });
            console.log(error);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
module.exports = activitiesRouter;
