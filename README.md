Byteking agent
==============
[![NPM version](http://img.shields.io/npm/v/byteking-agent.svg)](https://www.npmjs.com/package/byteking-agent)

The new generation monitoring and analytics service agent for ambitious applications.

Description
-----------
Nodejs agent provides transfer client data to ByteKing servers. Separated receiving service ensure the best network package 
loss protection. It can be used as both independent service (soon) or part of your application.

Installation
------------
It can be easily installed by npm.
```bash
npm install byteking-agent
```

Include installed package to your script and initialise with configuration file to run agent. Please see configuration example in `/example/custom_example.json`
```js
const ByteKingAgent = require('byteking-agent');
ByteKingAgent.run({
                      udp_server: {
                          port: 40001
                      },
                      transmitter: {
                          url:'http://127.0.0.1:8080'
                      },
                      debug: false
                  });
```

Then
>> node bk.js \
--debug true \
--udp_server:port 40000 \
--udp_server:address 127.0.0.1
--transmitter:url http://127.0.0.1:8090 \
--transmitter:data_send_force 1000 \
--transmitter:data_send_interval 10000 \


Byteking agent get metric data from the web client(s).
Official clients:
- PHP https://github.com/startbase/byteking-php

Contribution
----
Thank you for interesting in Byteking. If you intend to make Byteking better you are fantastic.
There are some ways to help to improve this product:
- Just use it and submit issues if you find ones
- Submit pull request

TODO
----
- Test coverage
