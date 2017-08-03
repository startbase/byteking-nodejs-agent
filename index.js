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
        nconf.argv();
        nconf.defaults({
            'udp_server': {
                'port': '',
                'address': '0.0.0.0'
            },
            'transmitter': {
                'host': '',
                'port': '',
                'use_ssl': false,
                'reconnect_time': 5000,
                'data_send_interval': 5000,
                'data_send_force': 100
            },
            'debug':false
        });


        this._data_send_force = nconf.get('transmitter:data_send_force');

        this._run_interval = true;
        this._interval = null;

        this._data_queue = [];
        this._transmitter = null;
        this._init_transmitter = false;
        this.debug = nconf.get('debug');

        this.log('byteking-agent process pid: ', process.pid);

    };

    log(...args) {
        if (this.debug) {
            console.log(args);
        }
    };

    initUdpServer() {
        this.log('init udp server');

        if (!nconf.get('udp_server:port')) {
            console.error('Error! Please check config, use "--udp_server:port 4000" for example');
            return;
        }


        const server = dgram.createSocket('udp4');
        server.on('error', function (err) {
            this.log('UDP Server error: ', err);
            server.close();
        });

        server.on('message', (message) => {
            this.addMessage(message);
        });

        server.on('listening', () => {
            this.log('UDP Server listening: ', server.address());
        });

        server.bind({port:nconf.get('udp_server:port'), address:nconf.get('udp_server:address')});
    };

    initTransmitter() {
        if (this._init_transmitter) {
            return;
        }

        this._init_transmitter = true;

        this.log('init transmitter');
        if (!nconf.get('transmitter:url')) {
            console.error('Error! Please check config, use "--transmitter:url ws://127.0.0.1:8090" for example');
            return;
        }

        let url = nconf.get('transmitter:url');

        this._transmitter = new WebSocket(url);

        this._transmitter.on('open', data => {
            BK._init_transmitter = false;
        });

        this._transmitter.on('message', data => {
            this.log(data);
        });

        this._transmitter.on('error', data => {
            setTimeout(function () {
                BK._init_transmitter = false;
                BK.initTransmitter();
            }, nconf.get('transmitter:reconnect_time'));
        });

    };

    addMessage(message) {
        this._data_queue.push(message.toString());
        this.log(this._data_queue.length, this._data_send_force);
        if (this._data_queue.length >= this._data_send_force) {
            clearInterval(this._interval);
            this._send();
            this.initInterval();
        }
    };

    run() {
        this.initUdpServer();
        this.initTransmitter();
        this.initInterval();
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
        this.log('send');
        if (!this._transmitter) {
            return;
        }

        if (this._transmitter.readyState != this._transmitter.OPEN) {
            this.initTransmitter();
            return;
        }

        try {
            this._transmitter.send(JSON.stringify(this._data_queue));
            this._data_queue = [];
            this.log(this._data_queue.length);
        } catch (e) {
            this.initTransmitter();
            return;
        }

    };
}

var BK = new ByteKingAgent();
module.exports = BK;