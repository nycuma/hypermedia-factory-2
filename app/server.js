/**
 * Created by Julian Richter on 02 Sep 2017
 *
 * Pushstate Server for static content
 */

var server = require('pushstate-server');

server.start({
    port: 3001,
    host: '127.0.0.1',
    directory: './'
});
