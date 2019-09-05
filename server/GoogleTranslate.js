var { translate } = require("google-translate-api-browser");
var readline = require("readline");

function translateString(string, fromLang, toLang, callback) {
    translate(string, {from: fromLang, to: toLang})
    .then(res => {
       callback(res);
    })
    .catch(err => {
        console.error(err);
    });
}

module.exports = translateString;