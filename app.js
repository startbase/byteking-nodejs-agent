const path = require('path');
const fs = require('fs');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const WebSocketClient = require(path.join(__dirname, './ws-client'));

const CONFIG_FILE = 'config.json';

function App() {
    this.data_queue = [];
    this.socket = null;

    this.initUpdServer = function(params) {
        server.on('error', function(err) {
            console.log('server error: ', err);
            server.close();
        });

        server.on('message', (message) => {
            this.data_queue.push(message.toString());
        });

        server.on('listening', () => {
            const address = server.address();
            console.log('server listening ', address);
        });
        server.bind(params['port']);
    };

    this.initWSTransmitter = function(params) {
        "use strict";
        let url = (params['use_ssl'] !== undefined && params['use_ssl']) ? 'wss' : 'ws';
        url += '://' + params['remote_address'] + ':' + params['remote_port'];
        this.socket = new WebSocketClient(url, params['reconnect_time_interval']);
    };

    this.init = function() {
        "use strict";
        const raw_config = fs.readFileSync(path.join(__dirname, CONFIG_FILE), 'utf8');
        const config = JSON.parse(raw_config);

        this.initUpdServer(config['udp_server']);
        this.initWSTransmitter(config['web_socket_client']);

        setInterval(() => {
            if(!this.socket.isOpen()) {
                return null;
            }
            //@todo переддавать только один api_key для массива
            let stack_length = this.data_queue.length;
            let stack_data = this.data_queue.splice(0, stack_length);

            this.socket.send(JSON.stringify(stack_data));
        }, config['data_transfer_interval']);
    }
}

(new App()).init();
