const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rockwellConfig = require("./config.js");

const db = require("./dbConnectExec.js");

const app = express();
app.use(express.json());

app.listen(5000, () => {
  console.log("app is running on port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

app.post("/contacts/login", async (req, res) => {
  // console.log("/contacts/login called", req.body);

  //1. data validation

  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Bad request");
  }

  //2. check that user exists in DB

  let query = `select *
  from Contact
  where email = '${email}'`;

  let result;
  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /contacts/login", myError);
    return res.status(500).send();
  }

  console.log("result", result);

  if (!result[0]) {
    return res.status(401).send("Invalid user credentials");
  }

  //3. check password

  let user = result[0];

  if (!bcrypt.compareSync(password, user.password)) {
    console.log("invalid password");
    return res.status(401).send("Invalid user credentials");
  }
  //4. generate token

  let token = jwt.sign({ pk: user.CustomerPK }, rockwellConfig.jwt, {
    expiresIn: "60 minutes",
  });

  console.log("token", token);

  //5. save token in DB and send response back

  let setTokenQuery = `update Contact
  set token = '${token}'
  where CustomerPK = ${user.CustomerPK}`;

  try {
    await db.executeQuery(setTokenQuery);

    res.status(200).send({
      token: token,
      user: {
        NameFirst: user.NameFirst,
        NameLast: user.NameLast,
        Email: user.Email,
        CustomerPK: user.CustomerPK,
      },
    });
  } catch (myError) {
    console.log("Error in setting user token", myError);
    res.status(500).send();
  }
});

app.post("/contacts", async (req, res) => {
  // res.send("/contacts called");

  // console.log("request body", req.body);

  let NameFirst = req.body.NameFirst;
  let NameLast = req.body.NameLast;
  let PhoneNumber = req.body.PhoneNumber;
  let Address = req.body.Address;
  let DOB = req.body.DOB;
  let Email = req.body.Email;
  let Password = req.body.Password;

  if (!NameFirst || !NameLast || !PhoneNumber || !Address || !DOB) {
    return res.status(400).send("Bad request");
  }

  NameFirst = NameFirst.replace("'", "''");
  NameLast = NameLast.replace("'", "''");

  let phoneCheckQuery = `select PhoneNumber
  from contact
  where PhoneNumber = '${PhoneNumber}'`;

  let existingUser = await db.executeQuery(phoneCheckQuery);

  // console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("Duplicate Phone Number");
  }

  let hashedPassword = bcrypt.hashSync(Password);

  let insertQuery = `insert into contact(NameFirst, NameLast, PhoneNumber, Address, DOB, email, password)
    values ('${NameFirst}', '${NameLast}}', '${PhoneNumber}', '${Address}', '${DOB}', '${Email}', '${hashedPassword}' )`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /contact", err);
      res.status(500).send();
    });
});

app.get("/orders", (req, res) => {
  //get data from the database
  db.executeQuery(
    `select *
  from [Order]
  left join barista
  on [order].EmployeeFK = barista.EmployeePK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/orders/:pk", (req, res) => {
  let pk = req.params.pk;
  // console.log(pk);
  let myQuery = `select *
  from [Order]
  left join barista
  on [order].EmployeeFK = barista.EmployeePK
  where orderID = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log("result", result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send("bad request");
      }
    })
    .catch((err) => {
      console.log("Error in /orders/:pk", err);
      res.status(500).send();
    });
});
