const jwt = require('jsonwebtoken');
const db = require('../dbConnExec');
const config = require('../config');
const auth = async (req, res, next) => {
    // console.log(req.header('Authorization'));
    try {
        let aToken = req.header('Authorization').replace('Bearer ', '');
        // console.log(aToken);
        let decodedToken = jwt.verify(aToken, config.JWT);
        // console.log(decodedToken);
        let userPK = decodedToken.pk;
        let checkTokenQuery = `Select UserPK,UName,FullName 
                               From LoginInfo
                               Where userPK=${userPK} and token ='${aToken}'`;
        let returnedLoginInfo = await db.executeQuery(checkTokenQuery);
        if (returnedLoginInfo[0]) {
            req.LoginInfo = returnedLoginInfo[0];
            next()
        }
        else {
            res.status(401).send('Authentication Failed');
        }
    }
    catch (aError) {
        res.status(401).send('Authentication Failed');
    }
}
module.exports = auth;