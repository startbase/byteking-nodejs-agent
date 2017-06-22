const path = require('path');
const ByteKingAgent = require(path.join(__dirname, '../byteking-agent'));

const bk = new ByteKingAgent();
bk.init(path.join(__dirname, './custom_config.json'));
