const path = require('path');
const ByteKingAgent = require(path.join(__dirname, '../index'));
// use code below on deploy
// const ByteKingAgent = require('byteking-agent');

const bk = new ByteKingAgent().run();
