const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const auth = require('./middleware/authenticate');
const app = express();
app.use(express.json());
const db = require('./dbConnExec');
const PORT = 1351;
app.listen(PORT, () => {
    console.log(`app is running on port ${PORT}`);
})

app.get("/",( req, res)=>
{
    res.send("Use /books , to see all records from Books table in the Database ");
})
app.get("/books", (req, res) => {
    let thisQuery = `Select BookID, Title,Author,Description,Price,GenreName 
                        from Book inner join BookGenre 
                        on GenreID= BookGenreID
                        order by Title`;
    db.executeQuery(thisQuery).then(result => {
        res.status(200).send(result);
    })
        .catch(err => {
            console.log(err);
            res.status(500).send("Bad Request");
        })
})
app.get("/books/:id", (req, res) => {
    let id = req.params.id;
    let thisQuery = `Select BookID, Title,Author,Description,Price,GenreName 
                        from Book inner join BookGenre 
                        on GenreID= BookGenreID
                        Where BookId=${id}`;
    db.executeQuery(thisQuery)
        .then(result => {
            if (result[0]) {
                res.status(200).send(result[0]);
            }
            else {
                res.status(404).send('No book with the specified Id');
            }
    })
        .catch(err => {
            console.log(err);
            res.status(500).send("Bad request");
        })
})

app.post("/register", async (req, res) => {
    console.log("request body:", req.body);
    let username = req.body.username;
    let userpassword = req.body.userpassword;
    let fullname = req.body.fullname;
    if (!username || !userpassword || !fullname) {
        return res.status(400).send('Give username, userpassword and fullname');
    }
    username = username.replace("'", "''");
    fullname = fullname.replace("'", "''");

    let usernameCheckQuery = `Select UName from LoginInfo where UName = '${username}'`;

    let duplicateusername = await db.executeQuery(usernameCheckQuery);

    if (duplicateusername[0]) {
        return res.status(400).send('username is already taken choose a different username');

    }

    let hashedpassword = bcrypt.hashSync(userpassword);

    let insertQuery = ` Insert into LoginInfo(UName,UPass,FullName) 
                         Values('${username}', '${hashedpassword}', '${fullname}')`;

    db.executeQuery(insertQuery)
        .then(() => res.status(201).send('Registration successful'))
        .catch(err => {
            console.log("error in POST /register", err);
            res.status(500).send("Registration Failed");
        })
})
app.post("/login", async (req, res) => {
    let username = req.body.username;
    let userpassword = req.body.userpassword;
    let checkusernameQuery = `Select * From LoginInfo Where UName='${username}'`;
    let result;
    try {
        result = await db.executeQuery(checkusernameQuery);
    }
    catch (aError) {
        console.log('error in /login', aError);
        return res.status(500).send();
    }
    let LoginInfo = result[0];
    if (!bcrypt.compareSync(userpassword, LoginInfo.UPass)) {
        return res.status(400).send('Invalid credentials');
    }
    let token = jwt.sign({ pk: LoginInfo.UserPK }, config.JWT, { expiresIn: '30 minutes' });
    console.log(token);
    let setTokenQuery = `Update LoginInfo 
                         Set token='${token}'
                         Where UserPK=${LoginInfo.UserPK}`;
    try {
        await db.executeQuery(setTokenQuery);
        res.status(200).send({
            token: token,
            LoginInfo: {
                Username: LoginInfo.UName,
                Fullname: LoginInfo.FullName,
                UserPK: LoginInfo.UserPK
            }
        })
    }
    catch (aError) {
        console.log("error setting user token", aError);
        res.status(500).send("Login Failed");
    }
})
app.post("/reviews/add", auth, async (req, res) => {
    try {
        let BookID = req.body.BookID;
        let Review = req.body.Review;

        if (!BookID || !Review) {
            return res.status(400).send('Please provide a valid BookID and Review text.');
        }
        let bookQuery = `SELECT * FROM Book WHERE BookID = ${BookID}`;
        let bookResult = await db.executeQuery(bookQuery);

        if (bookResult.length === 0) {
            return res.status(404).send('Book not found. Please provide a valid BookID.');
        }

        let escapedReview = Review.replace("'", "''");

        let insertReviewQuery = `Insert into Review (BookID, ReviewText, UserPK)
                                Output inserted.ReviewID, inserted.ReviewText, inserted.UserPK
                                Values (${BookID}, '${escapedReview}', ${req.LoginInfo.UserPK})`;

        let insertedReview = await db.executeQuery(insertReviewQuery);

        res.status(201).send(insertedReview[0]);
    }
    catch (aError) {
        console.error('Error in POST /reviews/add', aError);
        res.status(500).send('Failed to add review');
    }
});
app.post('/logout', auth, (req, res) => {
    var updateBookQuery = `Update LoginInfo Set token = NULL
                            Where userpk = ${req.LoginInfo.UserPK}`;

    db.executeQuery(updateBookQuery)
        .then(() => { res.status(200).send('Signed Out') })
        .catch(aError => {
            console.log("Error in POST /logout", aError);
            res.status(500).send('You are still here');
        })
})