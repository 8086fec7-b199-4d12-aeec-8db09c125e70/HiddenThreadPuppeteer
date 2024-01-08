import express from 'express'
import HiddenThreadForm from './HiddenThreadForm.js'
import {hydrate, inCaseOfError, validate} from './functions.js'

const app = express();
app.post('/encode', async (request, response) => {
    const form = await hydrate(request)
    if (validate(form, response)) {
        new HiddenThreadForm()
            .fill({encode: form})
            .encode()
            .then(encodedFilePath => response.sendFile(encodedFilePath))
            .catch(error => inCaseOfError(error, response))
    }
})

app.post('/decode', async (request, response) => {
    const form = await hydrate(request)
    if (validate(form, response)) {
        new HiddenThreadForm()
            .fill({decode: form})
            .decode()
            .then(function (encodedFilePath) {
                response.writeHead(200);
                response.end(JSON.stringify(encodedFilePath));
            })
            .catch(error => inCaseOfError(error, response))
    }
})

app.get('/get_keys', async (request, response) => {
    new HiddenThreadForm()
        .genKeys()
        .then(function (encodedFilePath) {
            response.writeHead(200);
            response.end(JSON.stringify(encodedFilePath));
        })
        .catch(error => inCaseOfError(error, response))
})

app.listen(80)