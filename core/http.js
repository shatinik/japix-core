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
            res.setHeader('content-type', 'application/json');
            let bodyRaw = '';
            let result = {};
            req.on('data', (chunk) => {
                bodyRaw += chunk.toString();
            });
            req.on('end', async () => {
                try {
                    let parse = bodyParserLoader(req.headers['content-type']);
                    let body = parse(bodyRaw);
                    requestUrl = url.parse(req.url);
        
                    if (requestUrl.pathname === '/favicon.ico' && props.blockFavicon === true) {
                        return;
                    }
                    let action = await Router.findAction(routesTable, requestUrl.pathname);
                    if (!action) {
                        res.statusCode = 404;
                    } else {
                        if (req.method.toLowerCase() !== action.method) {
                            res.statusCode = 404;
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
                    res.statusCode = 500;
                    result = {'message': 'Internal Server Error'};
                    res.end(JSON.stringify(result));
                    throw e;
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