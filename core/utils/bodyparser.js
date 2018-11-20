const querystring = require('querystring');

function choose(contentType) {
    try {
        switch (contentType) {
            case 'application/x-www-form-urlencoded': {
                return querystring.parse;
            }
            default: {
                throw new Error('Unknown Content-Type');
            }
        }
    } catch (e) {
        throw e;
    }    
}

module.exports = choose;