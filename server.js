const mqtt = require('mqtt');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mqtt_id = 'avior_neop';
const mqtt_pass = 'kSMGnMTCnC2ctqG';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const client = mqtt.connect('mqtts://mqtt.neop.site:8883',{
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: mqtt_id,
    password: mqtt_pass,
    reconnectPeriod: 1000,
    rejectUnauthorized: false,
});
const obj = {};
const port = process.env.PORT || 3000;
//avior_neop - kSMGnMTCnC2ctqG
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('command', msg => {
        io.emit('command', msg);
        let req = JSON.parse(msg);
        console.log(req);
        client.publish(req['topic'], req['value'])
    });
});

http.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});

client.on('connect', function () {
    client.subscribe('#')
})

client.on('message', function (topic, message) {
    // console.log([topic, message.toString()]);
    convert([topic, message.toString()], obj);
    let json = JSON.stringify(obj, null, 3);
    io.emit('data', json);
    io.emit('last', JSON.stringify([topic, message.toString()]));

    // console.log(JSON.stringify(obj, null, 3));
    // display(JSON.stringify(obj, null, 3));
    // client.end()
})

function convert(arr, obj) {
    const lastIndex = arr.length - 1;
    let currObj = obj;

    const elements = arr[0].split('/');

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!currObj[element]) {
            currObj[element] = {};
        }

        currObj = currObj[element];
    }

    if (!currObj[lastIndex]) {
        currObj[lastIndex] = [];
    }

    currObj[lastIndex].push(arr[lastIndex]);
}