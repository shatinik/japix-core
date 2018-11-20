const Router = require('./router/router');
const https = require('https');
const url = require('url');
const fs = require('fs');

class Https {
    /**
     * @private
     */
    static async init(routesTable, props) {
        if (!props.certificates.privkey) {
            throw new Error('No server privateKey found'); 
        }
        if (!props.certificates.cert) {
            throw new Error('No server certificate found'); 
        }

        let option = {};

        try {
            const CAkey = props.certificates.ca ? fs.readFileSync(props.certificates.ca) : null;
            const ServerCert =  fs.readFileSync(props.certificates.cert);
            const ServerCertPassphrase = props.certificates.passphrase;
            const ServerKey =  fs.readFileSync(props.certificates.privkey);
            const ServerRequestClientCert = props.certificates.requestCert ? true : false;
            const ServerRejectUnauthorized = props.certificates.rejectUnauthorized ? true : false;

            if (ServerRequestClientCert && !CAkey) {
                throw new Error('No CAkey found'); 
            }
    
            option = {
                key: ServerKey,
                cert: ServerCert,
                ca: CAkey,
                passphrase: ServerCertPassphrase,
                requestCert: ServerRequestClientCert,
                rejectUnauthorized: ServerRejectUnauthorized
            };
        } catch (err) {
            throw err;
        }

        return https.createServer(option, async (request, response) => {
            let requestUrl = url.parse(request.url);

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
                    let routedData = await Router.getRouteData({
                        model: action.data,
                        body: {},
                        requestUrl: requestUrl
                    });
                    result = await action.action(routeData);
                } else {
                    status = 404;
                }
            }
            response.respond({
                'content-type': 'application/json',
                ':status': status
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

module.exports = Https;