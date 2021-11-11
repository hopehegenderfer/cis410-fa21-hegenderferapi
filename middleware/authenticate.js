const jwt = require("jsonwebtoken");

const db = require("../dbConnectExec.js");
const rockwellConfig = require("../config");

const auth = async (req, res, next) => {
  // console.log("in the middleware", req.header("Authorization"));
  // next();

  try {
    //1. decode the token

    let myToken = req.header("Authorization").replace("Bearer ", "");
    console.log("token", myToken);

    let decoded = jwt.verify(myToken, rockwellConfig.jwt);
    console.log(decoded);

    let CustomerPK = decoded.pk;

    //2. compare token with database

    let query = `select CustomerPK, NameFirst, NameLast, Email
    from Contact
    where CustomerPK=${CustomerPK} and token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);
    console.log("returned user", returnedUser);

    //3. save user information in the request

    if (returnedUser[0]) {
      req.contact = returnedUser[0];
      next();
    } else {
      return res.status(401).send("invalid credentials");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send("invalid credentials");
  }
};

module.exports = auth;
