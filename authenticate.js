//name: vamsitha
const jwt = require('jsonwebtoken');

const db = require('../dbConnExec');

const config = require('../config');

const auth = async (req, res, next) => {
    //console.log(req.header('Authorization'));
    try {
        let aToken = req.header('Authorization').replace('Bearer', ''); 0
        //console.log(aToken);

        let decodedToken = jwt.verify(aToken, config.JWT);
        //console.log(decodedToken);

        let contactpk = decodedToken.pk;

        let checkTokenQuery = `Select ContactPK, FirstName, LastName, Email From Contact Where contactpk = ${contactPK} and token = '${aToken}'`;

        let returnedContact = await db.executeQuery(checkTokenQuery);

        if (returnedContact[0]) {
            req.contact = returnedContact[0];
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