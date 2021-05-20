"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const endpoints_1 = require("./2_entities/endpoints");
const port = 3000;
const server = endpoints_1.endpoints.listen(port, () => {
    console.log('Running in this mode: ' + process.env.NODE_ENV);
    console.log('This server is listening at port:' + port);
});
//# sourceMappingURL=launch.js.map