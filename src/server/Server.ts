
import * as http from 'http';
import HandleHttpRequest, {HandleHttpParams} from './HandleHttpRequest';
import * as SocketIo from 'socket.io';
import {HTTP_PORT} from "../Constants";
import {playerIdToSocket} from "./Api";

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
        console.log('ololo incoming connection');
        socket.on('message', (data, reply) => {
            if (data.messageType === 'subscribePlayer') {
                const {playerId} = data;
                if (!playerIdToSocket.has(playerId)) {
                    playerIdToSocket.set(playerId, new Set());
                }
                playerIdToSocket.get(playerId)?.add(socket);
                reply({status: 'SUCCESS'});
            } else {
                console.log('Unexpected message from client', data);
                reply({status: 'UNEXPECTED_MESSAGE_TYPE'});
            }
        });
    });
    socketIo.listen(server);
};

export default Server;
