'use strict';

const dgram = require('dgram');
const WebSocket = require('ws');
const md5 = require('md5');
const merge = require('deepmerge');

class ByteKingAgent {
    /**
     * Creates a ByteKingAgent instance.
     */

    constructor() {

        this.config = {
            udp_server: {
                port: 40004,
                address: '0.0.0.0'
            },
            transmitter: {
                url:'',
                host:'',
                port:'',
                use_ssl:false,
                reconnect_time:5000,
                data_send_interval:5000,
                data_send_force:100
            },
            debug:false

        };
    };

    log() {
        if (this.config.debug) {
            console.log(arguments);
        }
    };

    initUdpServer() {
        this.log('init udp server');

        if (!BK.config.udp_server.port) {
            console.error('Error! Please check config, use "--udp_server:port 4000" for example');
            return;
        }


        const server = dgram.createSocket('udp4');
        server.on('error', (err) => {
            this.log('UDP Server error: ', err);
            server.close();
        });

        server.on('message', (message) => {
            this.addMessage(message.toString());
        });

        server.on('listening', () => {
            this.log('UDP Server listening: ', server.address());
        });

        server.bind({port: BK.config.udp_server.port, address: BK.config.udp_server.address});
    };

    initTransmitter() {
        if (this._init_transmitter) {
            return;
        }

        this._init_transmitter = true;

        this.log('init transmitter');
        if (!BK.config.transmitter.url) {
            console.error('Error! Please check config, use "--transmitter:url ws://127.0.0.1:8090" for example');
            return;
        }

        let url = BK.config.transmitter.url;

        this._transmitter = new WebSocket(url);

        this._transmitter.on('open', data => {
            BK._init_transmitter = false;
        });

        this._transmitter.on('message', data => {
            this.log(data);
        });

        this._transmitter.on('error', data => {
            setTimeout(() => {
                BK._init_transmitter = false;
                BK.initTransmitter();
            }, BK.config.transmitter.reconnect_time);
        });

    };

    addMessage(message) {
        if (message.indexOf("_") === 0) {
            this.multiMessage(message);
            return;
        }

        this._data_queue.push(message);
        this.log(this._data_queue.length, this._data_send_force);
        if (this._data_queue.length >= this._data_send_force) {
            clearInterval(this._interval);
            this._send();
            this.initInterval();
        }
    };

    multiMessage(message) {
        let result_size = 0;
        let cur_item = 0;
        let hash = '';
        let msg_hash = '';
        let msg = '';

        if (message.indexOf("_p_") === 0) {
            let slice = 3;
            result_size = message.substring(slice, slice + this.part_block_size);
            slice += this.part_block_size + 1;
            cur_item = message.substring(slice, slice + this.part_block_size);
            slice += this.part_block_size + 1;
            hash = message.substring(slice, slice + 32);
            slice += 32 + 1;
            msg_hash = message.substring(slice, slice + 32);
            slice += 32 + 1;
            msg = message.substring(slice);
        }

        if (!this.multi_msgs.has(hash)) {
            this.multi_msgs.set(hash, new Map());
        }

        let part = this.multi_msgs.get(hash);
        part.set(parseInt(cur_item), msg);

        if (part.size === parseInt(result_size)) {
            if (this.multiMessageCompare(part, msg_hash)) {
                this.multi_msgs.delete(hash);
                return;
            } else {
                setTimeout(() => {
                    this.multiMessageCompare(part, msg_hash);
                    this.multi_msgs.delete(hash);
                }, 1000);
            }
        }
    };

    multiMessageCompare(part, msg_hash) {
        let result = '';
        let parts = [...part.entries()].sort();
        for (let i in parts) {
            if (parts.hasOwnProperty(i)) {
                result += parts[i][1];
            }
        }

        if (md5(result) === msg_hash) {
            this.log('multi success send', msg_hash);
            this.addMessage(result);
            return true;
        }
        return false;
    };

    run(config) {
        if (config) {
            BK.config = merge(BK.config, config);
        }

        this.log('byteking-agent process pid: ', process.pid);


        this._data_send_force = BK.config.transmitter.data_send_force;

        this._run_interval = true;
        this._interval = null;

        this._data_queue = [];
        this._transmitter = null;
        this._init_transmitter = false;
        this.debug = BK.config.debug;
        this.multi_msgs = new Map();

        this.part_block_size = 3;


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
        }, BK.config.transmitter.data_send_interval);
    };

    _send() {
        this.log('send');
        if (!this._transmitter) {
            return;
        }

        if (this._transmitter.readyState !== this._transmitter.OPEN) {
            this.initTransmitter();
            return;
        }

        let data = this._data_queue;
        this._data_queue = [];

        try {
            this._transmitter.send(JSON.stringify(data));
            this.log(data.length);
        } catch (e) {
            this.log("Error send", e.code, e.message);
            this._data_queue.push(...data);
            this.initTransmitter();
            return;
        }

    };
}

let BK = new ByteKingAgent();
module.exports = BK;