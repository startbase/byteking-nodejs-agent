const WebSocket = require('ws');

function WebSocketClient(url, reconnect_interval) {
    this.reconnect_interval = reconnect_interval;
    this.url = url;

    this.open();
}
WebSocketClient.prototype.open = function() {
    this.instance = new WebSocket(this.url);
    this.instance.on('close',(e) => {
        if(e !== 1000) {
            this.reconnect();
        }
    });
    this.instance.on('error',(e) => {
        console.log('Error code: ' + e.code);
    });
};
WebSocketClient.prototype.send = function(data,option) {
    if(this.isOpen()) {
        this.instance.send(data, option);
    }
};
WebSocketClient.prototype.isOpen = function() {
    return this.instance.readyState === WebSocket.OPEN;
};
WebSocketClient.prototype.reconnect = function() {
    console.log(`Reconnecting in ${this.reconnect_interval}ms`);
    setTimeout(() => {
        this.open();
    }, this.reconnect_interval);
};

module.exports = WebSocketClient;