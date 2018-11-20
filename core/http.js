const http = require('http');
const url = require('url');
const Router = require('./router/router');

class Http {
    /**
     * @private
     */
    static async init(routesTable, props) {   
        let requestUrl = '';

        return http.createServer(async (request, response) => {
            requestUrl = url.parse(request.url);

            if (requestUrl.pathname === '/favicon.ico' && props.blockFavicon === true) {
                return;
            }
            let action = await Router.findAction(routesTable, requestUrl.pathname);
            let result = {};
            let status = 200;
            if (!action) {
                status = 404;
            } else {
                if (request.method.toLowerCase() === action.method) {
                    let routeData = await Router.getRouteData({
                        model: action.data,
                        body: {},
                        requestUrl: requestUrl
                    });
                    result = await action.action(routeData);
                } else {
                    status = 404;
                }
            }
            console.log(status);
            response.writeHead(status, {
                'content-type': 'application/json'
            });
            response.end(JSON.stringify(result));
        });
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