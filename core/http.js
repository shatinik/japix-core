const http = require('http');
const url = require('url');
const Router = require('./router/router');
const bodyParserLoader = require('./utils/bodyparser');
class Http {
    /**
     * @private
     */
    static async init(routesTable, props) {
        let requestUrl = '';
        let server = new http.Server();

        server.on('request', async (req, res) => {
            let result = {};
            res.setHeader('content-type', 'application/json');
            
            let bodyRaw = '';
            req.on('data', (chunk) => {
                bodyRaw += chunk.toString();
            });

            req.on('error', e => {
                result = { 'message': e.message };
                res.end(JSON.stringify(result));
                console.error(e);
            });
            req.on('end', async () => {
                try {
                    let authstring = new Buffer((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString();
                    if (authstring !== 'test:1337') {
                        res.statusCode = 401;
                        res.setHeader('WWW-Authenticate', 'Basic realm="nope"');
                        throw new Error('Wrong auth data');
                    }
                    let parse = bodyParserLoader(req.headers['content-type']);
                    let body = parse(bodyRaw);
                    requestUrl = url.parse(req.url);

                    if (requestUrl.pathname === '/favicon.ico' && props.blockFavicon === true) {
                        return;
                    }
                    let action = await Router.findAction(routesTable, requestUrl.pathname);
                    if (!action) {
                        res.statusCode = 404;
                        throw new Error('Page not found');
                    } else {
                        if (req.method.toLowerCase() !== action.method) {
                            res.statusCode = 404;
                            throw new Error('Page not found');
                        } else {
                            let routeData = await Router.getRouteData({
                                model: action.data,
                                body: body,
                                requestUrl: requestUrl
                            });
                            result = await action.action(routeData);
                        }
                    }
                    res.end(JSON.stringify(result));
                } catch (e) {
                    result = { 'message': e.message };
                    res.end(JSON.stringify(result));
                    req.emit('error', e);
                }
            });
        });

        return server;
    }

    /**
     * @public
     */
    static async listen(routesTable, props) {
        try {
            let server = await this.init(routesTable, props);
            server.listen(props.port, () => {
                console.log('JAPIX is working!');
            });
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Http;  