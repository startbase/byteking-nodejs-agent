#Byteking agent
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
const path = require('path');
const ByteKingAgent = require('byteking-agent');

const bk = new ByteKingAgent();
bk.init(path.join(__dirname, './config.json'));
```

Byteking agent get metric data from the web client(s).
Official clients:
- PHP https://github.com/startbase/byteking-php

Contribution
----
Thank you for interesting in Byteking. If you want intend to make Byteking better you are fantastic.
There are some ways to help to improve this product:
- Just use it and submit issues if you find ones
- Submit pull request

TODO
----
- Do something with configurations. It only possible to get configurations from the file now.
- Think something about improving network balancer
- Test coverage
