const express = require('express');
const db = require('./dbConnExec');
const app = express();
app.use(express.json());
const PORT = 1351;
app.listen(PORT, () => {
    console.log(`app is running on port ${ PORT }`);
})

app.get("/", (req, res) => {
    res.send("Look  Ma, I can do a Node REST API");
})

app.get("/pa", (req, res) => {
    res.send("Look  Pa, I am an ace with Node REST API");
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
})