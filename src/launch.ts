import {app} from './server'


const port = 3000;


const server = app.listen(port, () =>{

    console.log('Running in this mode: '+process.env.NODE_ENV);
    console.log('This server is listening at port:' + port);
} );



