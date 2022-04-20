const
    fs = require('fs'),
    http = require('http'),
    open = require('open'),
    { WebSocketServer } = require('ws'),
    SMTPServer = require("smtp-server").SMTPServer,
    simpleParser = require('mailparser').simpleParser;


const httpServer = http.createServer((req, res) => {
    // serve statics
    fs.readFile(__dirname + req.url, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
})

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });
});

httpServer.listen(12345, () => {
    console.log(`http 服务启动成功，访问 http://localhost:12345`);
    open('http://localhost:12345/index.html');
});

const smtpServer = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
        simpleParser(stream, (err, parsed) => {
            if (err) {
                console.error(`simpleParser error:`, err)
            } else {
                console.dir(parsed)
                wss.clients.forEach(client => {
                    client.send(JSON.stringify({ type: 'receiveMail', data: parsed }))
                })
            }
        });

        stream.on("end", callback);
    }
});

smtpServer.listen(25, () => console.log(`smtp 服务启动成功！`))
