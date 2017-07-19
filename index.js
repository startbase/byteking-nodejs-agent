const path = require('path');
const fs = require('fs');
const dgram = require('dgram');
const WebSocketClient = require(path.join(__dirname, './ws-client'));
var app = require('http').createServer();
var io = require('socket.io')(app);

'use strict';


module.exports = function ByteKingAgent() {console.log(process.pid);
    this.config_dir = path.join(__dirname, 'config.json');
    this.data_queue = [];
    this.socket = null;
    this.cur_data_length = 0;
    this.data_transfer_length = 0;

    this.initUpdServer = function(params) {
        const server = dgram.createSocket('udp4');
        server.on('error', function(err) {
            console.log('server error: ', err);
            server.close();
        });

        server.on('message', (message) => {
            this._sendMessage(message);
        });

        server.on('listening', () => {
            const address = server.address();
            console.log('server listening ', address);
        });
        server.bind(params['port']);
    };

    this.initSocketServer = function(port) {
        app.listen(port);

        io.on('connection', (socket) => {
            console.log('client connected');
            socket.on('message', (data) => {
                this._sendMessage(data);
            });
        });

    };

    this.initWSTransmitter = function(params) {
        let url = (params['use_ssl'] !== undefined && params['use_ssl']) ? 'wss' : 'ws';
        url += '://' + params['remote_address'] + ':' + params['remote_port'];
        this.socket = new WebSocketClient(url, params['reconnect_time_interval']);
    };

    this._sendMessage = function(message) {
        let str_data = message.toString();
        this.data_queue.push(str_data);
        this.cur_data_length += str_data.length;
        if(this.cur_data_length > this.data_transfer_length) {
            this.send();
        }
    };

    this.init = function(config_dir) {
        config_dir = config_dir || this.config_dir;
        const raw_config = fs.readFileSync(config_dir, 'utf8');
        const config = JSON.parse(raw_config);
        this.data_transfer_length = config['data_transfer_length'];

        this.initSocketServer(config['socket_server']['port']);
        this.initUpdServer(config['udp_server']);
        this.initWSTransmitter(config['web_socket_client']);

        setInterval(() => {
            this.send();
        }, config['data_transfer_interval']);
    };

    this.send = function() {
        if(!this.socket.isOpen()) {
            return null;
        }
        //@todo переддавать только один api_key для массива
        let stack_length = this.data_queue.length;
        let stack_data = this.data_queue.splice(0, stack_length);
        this.cur_data_length = 0;
        this.socket.send(JSON.stringify(stack_data));
    };
};
