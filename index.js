'use strict';

/**
 * Module exports.
 * @public
 */

const nconf = require('nconf');
const dgram = require('dgram');
const WebSocket = require('ws');

class ByteKingAgent {
    /**
     * Creates a ByteKingAgent instance.
     */

    constructor() {
        
        console.log('byteking-agent process pid: ', process.pid);

        nconf.argv();

        nconf.defaults({
            'udp_server': {
                'port': 41452
            },
            'transmitter': {
                'host': '',
                'port': '',
                'use_ssl': false,
                'reconnect_time_interval': 5000,
                'data_send_interval': 10000,
                'data_send_force': 100
            }
        });

        this._data_send_force = nconf.get('transmitter:data_send_force');

        this._run_interval = null;
        this._interval = null;

        this._data_queue = [];
        this._transmitter = null;

    };

    initUdpServer() {
        const server = dgram.createSocket('udp4');
        server.on('error', function (err) {
            console.log('UDP Server error: ', err);
            server.close();
        });

        server.on('message', (message) => {
            this.addMessage(message);
        });

        server.on('listening', () => {
            console.log('UDP Server listening: ', server.address());
        });

        server.bind(nconf.get('udp_server:port'));
    };

    initTransmitter() {
        if (!nconf.get('transmitter:url')) {
            console.error('Error! Please check config.json, url for transmitter not found.');
            return;
        }

        let url = nconf.get('transmitter:url');



        this._transmitter = new WebSocket(url);

        this._transmitter.on('open', function open() {
           // ws.send('something');
        });

        this._transmitter.on('message', function incoming(data) {
            console.log(data);
        });


    };

    addMessage(message) {
        this._data_queue.push(message.toString());
        console.log(this._data_queue.length, this._data_send_force);
        if (this._data_queue.length > this._data_send_force) {
            this._run_interval = false;
            this._send();
            this._run_interval = true;
        }
    };

    run() {
        this.initUdpServer();
        this.initTransmitter();
        this.initInterval();

        setInterval(() => {
            this.addMessage("{'test'}");
        }, 500);

        return this;
    };

    initInterval() {
        this._interval = setInterval(() => {
            if (this._run_interval) {
                this._send();
            }
        }, nconf.get('transmitter:data_send_interval'));
    };

    _send() {
        console.log('send');
        if (!this._transmitter) {
            return;
        }

        if (this._transmitter.readyState != this._transmitter.OPEN) {
            return;
        }

        this._transmitter.send(JSON.stringify(this._data_queue), function (e) {
            console.log(e);
        });
        this._data_queue = [];
        console.log(this._data_queue.length);
    };
}


module.exports = new ByteKingAgent();