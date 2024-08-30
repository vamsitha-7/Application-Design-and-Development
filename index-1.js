//Name: vamsitha



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

app.get("/", (req, res) => {
    res.send("Look Ma, I can do a Node REST API");
})

app.get("/pa", (req, res) => {
    res.send("Look Pa,I am an ace with Node REST API");
})

app.get("/films", (req, res) => {
    let thisQuery = `Select filmpk, MovieTitle, PitchText, AmountBudgeted, summary, DateInTheaters, rating from film inner join FilmRating on ratingpk = RatingFK order by MovieTitle`;
    db.executeQuery(thisQuery)
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        })
})

app.get("/films/:id", (req, res) => {
    let id = req.params.id;

    let thisQuery = `Select filmpk, MovieTitle, PitchText, AmountBudgeted, summary, DateInTheaters, rating from film inner join FilmRating on ratingpk = RatingFK Where filmpk = ${id}`;
    db.executeQuery(thisQuery)
        .then(result => {
            if (result[0]) {
                res.status(200).send(result[0]);
            }
            else {
                res.status(404).send('bad request');
            }
            
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        })
})


app.post("/register", async (req, res) => {
    console.log("request body:", req.body);

    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let userPassword = req.body.userPassword;

    if (!firstName || !lastName || !email || !userPassword) {
        return res.status(400).send('bad request');
    }

    firstName = firstName.replace("'", "''");
    lastName = lastName.replace("'", "''");

    let emailCheckQuery = `Select email from contact where email = '${email}'`;

    let duplicateEmail = await db.executeQuery(emailCheckQuery);

    if (duplicateEmail[0]) {
        return res.status(400).send('Please enter a different email');

    }

    let hashedPassword = bcrypt.hashSync(userPassword);

    let insertQuery = `Insert into contact(FirstName, LastName, Email, UserPassword) Values('${firstName}', '${lastName}','${email}', '${hashedPassword}')`;

    db.executeQuery(insertQuery)
        .then(() => res.status(201).send('Registration successful'))
        .catch(err => {
            console.log("error in POST /register", err);
            res.status(500).send();
        })
})

app.post("/login", async (req, res) => {
    let email = req.body.email;
    let userPassword = req.body.userPassword;

    let checkEmailQuery = `Select * From contact Where email = '${email}'`;

    let result;

    try {
        result = await db.executeQuery(checkEmailQuery);
    }
    catch (aError) {
        console.log('error in /login', aError);
        return res.status(500).send();
    }

    let contact = result[0];

    if (!bcrypt.compareSync(userPassword, contact.UserPassword)) {
        return res.status(400).send('Invalid credentials');
    }

    let token = jwt.sign({ pk: contact.ContactPK }, config.JWT, { expiresIn: '30 minutes' });

    console.log(token);

    let setTokenQuery = `Update contact 
                         Set token = '${token}'
                         Where contactpk =${contact.ContactPK}`;

    try {
        await db.executeQuery(setTokenQuery);

        res.status(200).send({
            token: token,
            contact: {
                FirstName: contact.FirstName,
                LastName: contact.LastName,
                Email: contact.Email,
                ContactPK: contact.ContactPK
            }
        })
    }
    catch (aError) {
        console.log("error setting user token", aError);
        res.status(500).send();
    }
})

app.post("/reviews/add", auth, async (req, res) => {
    try {
        let filmFK = req.body.filmFK;
        let summary = req.body.summary;
        let rating = req.body.rating;

        if (!filmFK || !summary || !rating || !Number.isInteger(rating)) {
            res.status(400).send('Bad Request');
        }

        summary = summary.replace("'", "''");

        let insertReviewQuery = `Insert into filmreview (reviewsummary, reviewrating, filmFK, contactfk)
                                    Output inserted.ReviewPK, inserted.ReviewSummary, inserted.ReviewRating, inserted.FilmFK Values('${summary}', ${rating}, ${filmFK}, ${req.contact.ContactPK})`;


        let insertedReview = await db.executeQuery(insertReviewQuery);

        res.status(201).send(insertedReview[0]);
    }
    catch (aError){
        console.log('Error in POST /reviews/add', aError);
        res.send(500).send('Add review failed');
    }
})

app.post('/logout', auth, (res, req) => {
    var updateContactQuery = `Update contact Set token = NULL
                                Where contactpk = ${req.contact.ContactPK}`;
    db.executeQuery(updateContactQuery)
        .then(() => { res.status(200).send('Signed Out') })
        .catch(aError => {
            console.log("Error in POST /logout", aError);
            res.status(500).send('You are still here');
        })
})
