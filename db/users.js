const client = require("./client");
const bcrypt = require('bcrypt');
// Work on this file FIRST

// user functions

// create and returns the new user
// ** this function needs to be completed first because other tests rely on it. 
async function createUser({ username, password }) {
  
  const SALT_COUNT = 10;
  const hashedPassword = await bcrypt.hash(password, SALT_COUNT)
    
  if (password.length < 8) {
    throw new Error("Password too short");
  }

  try {
    const existingUser = await getUser({ username });
    if (existingUser) {
      throw new Error('Username already taken');
    }
    
  } catch (error) {
    console.log(error)
    throw error;

  }

  try {
    const { rows } = await client.query(
      `
      INSERT INTO users(username, password)
      VALUES($1, $2)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username;
    `,
      [username, hashedPassword]
    );
    
    return rows[0];
  } catch (error) {
    console.log(error) ;
    return null
  }
}


// this function should return a single user (object) from the database that matches the userName that is passed in as an argument. 
// INCLUDES PASSWORD IN THE RETURN OBJECT
async function getUserByUsernameWithPassword(username) {
  try {
    const { rows } = await client.query(
      `
      SELECT *
      FROM users
      WHERE username = $1;
      `,
      [username]
    );
    
    if (rows.length === 0) {
      return null;
    }
    if(!username) {
      return null;
    }
    const user = rows[0];
    
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


// this should be able to verify the password against the hashed password
// and if the passwords match then it should return a single user (object) 
// from the database that matches the username that is passed in 
// as part of the argument

async function getUser( {username, password} ) {
  try {   
    
    const user = await getUserByUsernameWithPassword(username);
    
    
    if (user) {

      const plaintextPassword = password;
      const hashedPassword = user.password;
      const isValid = await bcrypt.compare(plaintextPassword, hashedPassword)
      
      if (!isValid) {
        return null;
      } else {
        delete user.password;
        
        return user
      }
    }

    return null

  } catch (error) {
    console.log(error);
    throw error;
  }
}



// this function should return a single user (object) from the database that matches the id that is passed in as an argument.
async function getUserById(userId) {
  try {
    const { rows } = await client.query (
      `
      SELECT id, username
      FROM users
      WHERE id = $1;
      `,
      [userId]
    )
    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    return user;
  } catch (error) {
    console.log(error)
  }
}



module.exports = {
  createUser,
  getUser,
  getUserById,
  getUserByUsernameWithPassword,
}
