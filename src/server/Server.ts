
import * as http from 'http';
import HandleHttpRequest, {HandleHttpParams} from './HandleHttpRequest';
import * as SocketIo from 'socket.io';
import {HTTP_PORT} from "../Constants";

const handleRq = ({rq, rs, rootPath}: HandleHttpParams) => {
    HandleHttpRequest({rq, rs, rootPath}).catch(exc => {
        rs.statusCode = exc.httpStatusCode || 500;
        rs.statusMessage = ((exc || {}).message || exc + '' || '(empty error)').slice(0, 300);
        rs.end(JSON.stringify({error: exc + '', stack: exc.stack}));
        const msg = 'Trilemma HTTP request ' + rq.url + ' ' + ' failed';
        console.error(msg, exc);
    });
};

/** @param rootPath - file system path matching the root of the website hosting this request */
const Server = async (rootPath: string) => {
    const server = http
        .createServer((rq, rs) => handleRq({rq, rs, rootPath}))
        .listen(HTTP_PORT, '0.0.0.0', () => {
            console.log('listening trilemma requests on http://localhost:23183');
        });

    const socketIo = SocketIo();
    socketIo.on('connection', socket => {
        console.log('ololo incoming connection', socket);
        socket.on('message', (data, reply) => {
            console.log('ololo incoming message', data);
            reply('hujtevuho');
        });
        socket.send({testMessage: 'hello, how are you?'}, (response: any) => {
            console.log('delivered testMessage to client', response);
        });
    });
    socketIo.listen(server);
};

export default Server;
