const sql = require("mssql");
const rockwellConfig = require("./config.js");

const config = {
  user: rockwellConfig.DB.user,
  password: rockwellConfig.DB.password,
  server: rockwellConfig.DB.server,
  database: rockwellConfig.DB.database,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(config);
  let result = await connection.query(aQuery);

  // console.log(result);
  return result.recordset;
}

// executeQuery(`select *
// from [Order]
// left join barista
// on [order].EmployeeFK = barista.EmployeePK`);

module.exports = { executeQuery: executeQuery };
