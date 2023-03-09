// Import des modules nécessaires
require('dotenv').config();
const mqtt = require('mqtt');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const {check, validationResult} = require('express-validator');

// Création d'une instance de connexion MQTT
const client = mqtt.connect('mqtt://0.tcp.eu.ngrok.io:15748');

// Initialisation d'un objet vide
const obj = {};

// Définition du port d'écoute
const port = process.env.PORT || 3000;

// Définition de la route d'accueil qui renvoie le fichier 'index.html'
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ecoute de l'événement 'connection' de Socket.IO
io.on('connection', (socket) => {
    // Ecoute de l'événement 'command' envoyé par un client
    socket.on('command', [
        check('topic').notEmpty(), // Vérification du sujet
        check('value').notEmpty() // Vérification de la valeur
    ], async (req, res) => { // Utilisation de la fonction asynchrone
        const errors = validationResult(req);
        if (!errors.isEmpty()) { // Si les données ne sont pas valides
            return res.status(422).json({errors: errors.array()}); // On renvoie une erreur
        }
        // Envoi de l'événement 'command' à tous les clients connectés
        io.emit('command', req.body);
        // Publication du message MQTT
        client.publish(req.body.topic, req.body.value)
    });
});

// Ecoute du port défini pour les connexions HTTP
http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});

// Ecoute de l'événement 'connect' de la connexion MQTT
client.on('connect', function () {
    // Abonnement à tous les sujets
    client.subscribe('#')
})

// Ecoute de l'événement 'message' de la connexion MQTT
client.on('message', function (topic, message) {

    // Conversion du sujet et du message en objet JSON
    convert([topic, message.toString()], obj);

    // Transformation de l'objet JSON en chaîne de caractères
    let json = JSON.stringify(obj, null, 3);

    // Envoi de l'objet JSON à tous les clients connectés
    io.emit('data', json);

    // Envoi du dernier sujet et message reçus à tous les clients connectés
    io.emit('last', JSON.stringify([topic, message.toString()]));

})

// Fonction de conversion du sujet et du message en objet JSON
function convert(arr, obj) {
    const lastIndex = arr.length - 1;
    let currObj = obj;

    const elements = arr[0].split('/');

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        // Si l'objet n'existe pas, on le crée
        if (!currObj[element]) {
            currObj[element] = {};
        }

        // On passe à l'objet suivant
        currObj = currObj[element];
    }

    // Si l'objet ne contient pas déjà un tableau, on en crée un
    if (!currObj[lastIndex]) {
        currObj[lastIndex] = [];
    }

    // On ajoute la valeur à la fin du tableau
    currObj[lastIndex].push(arr[lastIndex]);
}