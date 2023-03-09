require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const app = express();

//Création d'une instance de connexion MQTT
const client = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    rejectUnauthorized: true //activation de la vérification du certificat
});

// Initialisation d'un objet vide
const obj = {};

// Définition du port d'écoute
const port = process.env.PORT || 3000;

// Définition de la route d'accueil qui renvoie le fichier 'index.html'

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ecoute de l'événement 'connection' de Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    },
    allowEIO3: true
});

//Vérification du mot de passe de l'utilisateur
const hashPassword = process.env.USER_PASSWORD_HASH;
const saltRounds = 10;
const idValidPassword = async (password) => {
    try {
        return await bcrypt.compare(password, hashPassword);
    } catch (error) {
        console.log(error);
        return false;
    }
};

//Ecoute de l'événement 'connection' de Socket.IO
io.on('connection', (socket) => {
    // Ecoute de l'événement 'command' envoyé par un client
    socket.on('command', async (req, res) => {
        const schema = Joi.object({
            topic: Joi.string().required(),
            value: Joi.string().required(),
            password: Joi.string().required()
        });
        const {error} = schema.validate(req);
        if (error) {
            return res.status(422).json({errors: error.details});
        }
        const validPassword = await idValidPassword(req.password);
        if (!validPassword) {
            return res.status(401).json({errors: 'Invalid password'});
        }
        // Envoi de l'événement 'command' à tous les clients connectés
        io.emit('command', req);
        // Publication du message MQTT
        client.publish(req.topic, req.value)
    });
});

// Ecoute du port défini pour les connexions HTTP
server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});

// Ecoute de l'événement 'connect' de la connexion MQTT
client.on('connect', function () {
    // Abonnement à tous les sujets
    client.subscribe('#')
});

// Ecoute de l'événement 'message' de la connexion MQTT
client.on('message', function (topic, message) {

    // Conversion du sujet et du message en objet JSON
    convert([topic, message.toString()], obj);

    // Transformation de l'objet JSON en chaîne de caractères
    let json = JSON.stringify(obj, null, 3);

    // Envoi de l'objet JSON à tous les clients connectés
    io.emit('message', json);
});

// Fonction de conversion du sujet et du message en objet JSON
function convert(arr, obj) {
    const lastIndex = arr.length - 1;
    let currObj = obj;
    arr.forEach((key, index) => {
        if (index === lastIndex) {
            currObj[key] = arr[index + 1];
        } else {
            if (!currObj[key]) {
                currObj[key] = {};
            }
            currObj = currObj[key];
        }
    });
}

function convet2(arr, obj) {
    const lastIndex = arr.length - 1;
    let currObj = obj;
    arr.forEach((key, index) => {
        if (index === lastIndex) {
            currObj[key] = arr[index + 1];
        } else {
            if (!currObj[key]) {
                currObj[key] = {};
            }
            currObj = currObj[key];
        }
    });
}