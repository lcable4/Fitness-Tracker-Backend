const express = require('express');
const usersRouter = express.Router();
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;
const { requireUser} = require("./utils")

const { getPublicRoutinesByUser, getAllRoutinesByUser } = require('../db/routines') 
const {
  getUserByUsernameWithPassword,
  getUser,
  createUser,
  getUserById 
  } = require("../db/users");





// POST /api/users/register
usersRouter.post("/register", async (req, res, next) => {
  const { username, password } = req.body;
  
  try {
    const register = await createUser({ username, password })
    if (password.length < 8) {
      next({
        name: "Password too short",
        message: "Password too short",
      })
    }
    const token = jwt.sign(
      {
        id: register.id,
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1w",
      }
    );

    res.send({
      message: "thank you for signing up",
      token,
      user: {
        id: register.id,
        username,
      },
    });
  } catch (error) {
    if (error.message === 'Username already taken') {
      return res.status(400).send({ message: 'Username already taken' });
    } else if(error.message === 'Password too short') {
      return res.status(400).send({ message: 'Password too short' });
    }else {
      console.log(error);
      return res.status(500).send({ message: 'Error creating user'});
    }
  }
});


// POST /api/users/login
usersRouter.post("/login", async (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    next({
      name: "MissingCredentialsError",
      message: "Please supply both a username and password",
    });
  }

  try {
    const user = await getUser({username, password});
    
    if (user) {
      const token = jwt.sign(
        {
          id: user.id,
          username,
        },
        JWT_SECRET
      );

      res.send({ message: "You are logged in!", token });
    } else {
      next({
        name: "IncorrectCredentialsError",
        message: "Username or Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// GET /api/users/me
usersRouter.get("/me", requireUser, async(req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    console.log(error)
    next(error);
  }
});


// GET /api/users/:username/routines
usersRouter.get("/:username/routines", async(req, res, next) => {
  let { username } = req.params;
  console.log(username, "USERNAME LOG")
  try {
    const userObject = await getUserByUsernameWithPassword(username);
    console.log(userObject, "USER OB")
    if (!userObject) {
      next({
        name: "UserDoesNotExist",
        message: `User: ${username} Does Not Exist.`,
      });
    } else if (req.user && userObject.id === req.user.id) {
      const allRoutines = await getAllRoutinesByUser({ username });
      console.log(allRoutines, "ALL ROUTINES LOG")
      res.send(allRoutines);
    } else {
      const publicRoutines = await getPublicRoutinesByUser({ username });
      console.log(publicRoutines, " PUBLIC ROUTINES LOG ")
      res.send(publicRoutines);
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});
module.exports = usersRouter;
