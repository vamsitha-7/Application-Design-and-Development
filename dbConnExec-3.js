const sql = require('mssql');
const config = require('./config');
const Team110DBConfig = {
    user: config.DB.user,
    password: config.DB.password,
    server: config.DB.server,
    database: config.DB.database,
    trustServerCertificate:config.DB.trustServerCertificate
}

async function executeQuery(aQuery) {
    let connection = await sql.connect(Team110DBConfig);
    let result = await connection.query(aQuery);
    return result.recordset;
}

module.exports = { executeQuery: executeQuery };