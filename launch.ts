import {app} from "./src/server";
const port = 3000;

const server = app.listen(port, () =>{
    console.log('Running in this mode: '+process.env.PORT);
    console.log('This server is listening at port:' + port);
});

