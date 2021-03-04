//express library for node js
const express = require('express');
const app = express();
const port = 3000;

//allows to parse incoming request bodies
const bodyParser = require('body-parser');

//allows to easily make request
const request = require("request");

//phone Tower database
const dataTower = require('./dataTower.json');

//Result object
let operateur = { 'Orange': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'SFR': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'Bouygue': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'Free': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'ArrOperateur': ['Orange', 'SFR', 'Bouygue', 'Free'], 'Display': 0, 'Error': 0 };

// func to check distance between two points
function dist(x1, x2, y1, y2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) };

// set the view engine to ejs
app.set('views', './pages');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.render('index', { data: operateur });
});

app.post('/', (req, res) => {
    //reset result obj between each call
    operateur = { 'Orange': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'SFR': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'Bouygue': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'Free': { 'On': 0, '2G': 0, '3G': 0, '4G': 0 }, 'ArrOperateur': ['Orange', 'SFR', 'Bouygue', 'Free'], 'Display': 0, 'Error': 0 };

    //encode input address
    const uri = req.body;
    const encoded = encodeURI(uri.item);
    const urlToQuery = 'https://api-adresse.data.gouv.fr/search/?q=' + encoded + '&limit=1';

    //Call the api that gives coordonates for an address
    request(urlToQuery, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            //log response body
            console.log('body: ' + body);

            var bodyParsed = JSON.parse(body);

            for (let i = 0; i < dataTower.length; i++) {
                //Bad adress err check
                if (bodyParsed.features[0] === undefined) {
                    operateur['Error'] = 1;
                    res.render('index', { data: operateur });
                    return null;
                }

                //Get coordonates of tower and address
                let x1 = bodyParsed.features[0].properties.x;
                let x2 = dataTower[i].X;
                let y1 = bodyParsed.features[0].properties.y;
                let y2 = dataTower[i].Y;

                //Compare coordonates between tower and address
                let distance = dist(x1, x2, y1, y2);

                //if tower is in distance get operateur and phone coverage
                if (distance < 5000) {
                    let contextOperateur = dataTower[i].Operateur;
                    operateur[contextOperateur]['On'] = 1;
                    if (dataTower[i]['2G']) {
                        operateur[contextOperateur]['2G'] = 1;
                    }
                    if (dataTower[i]['3G']) {
                        operateur[contextOperateur]['3G'] = 1;
                    }
                    if (dataTower[i]['4G']) {
                        operateur[contextOperateur]['4G'] = 1;
                    }
                }
            }
            //flag to display the result
            operateur.Display = 1;
        }
        res.render('index', { data: operateur });
    });
});

//listen to port
app.listen(port, () => {
    console.log(`Phone coverage app listening at http://localhost:${port}`);
})
