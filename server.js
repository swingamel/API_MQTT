const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');
const app = express();
const broker = 'mqtt://127.0.0.1:1883';
const clientId= 'front-13742';
// CONNEXION UNIQUE
const client = mqtt.connect(broker, {clientId: clientId});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/api/publish', (req, res) => {
    let string = `Le message "${req.body.message}" a été publié sur le topic "${req.body.topic}`;
    let rep = {message: string};

    client.publish(req.body.topic, req.body.message, function (err) {
        if (!err) {
            console.log('Message publié avec succès');
        } else {
            console.log(err);
        }
    });

    res.end(JSON.stringify(rep));
});

app.listen(3000, () => {
    console.log('Serveur démarré sur le port 3000');
});