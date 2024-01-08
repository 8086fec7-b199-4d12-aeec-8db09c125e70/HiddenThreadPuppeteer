import {formidable} from 'formidable'
import fs from 'fs'
import {fileTypeFromFile} from 'file-type'
import path from 'path'
import crypto from 'crypto'

const inputsDir = '/tmp/inputs/'
if (!fs.existsSync(inputsDir)) {
    fs.mkdirSync(inputsDir, {recursive: true});
}

export const hydrate = async function (request) {
    const form = Object.assign({},
        ...await formidable({multiples: true}).parse(request)
    )

    let containerFile = form['container.file']?.[0]?.filepath
    if (containerFile && fs.existsSync(containerFile)) {
        const fileType = await fileTypeFromFile(containerFile);
        const newDestination = inputsDir + path.basename(containerFile) + '.' + fileType.ext
        fs.renameSync(containerFile, newDestination)
        containerFile = newDestination
    }

    const postFiles = []
    const iterable = form['post.files'] ?? []
    for (const postFile of iterable) {
        const file = postFile.filepath
        if (file && fs.existsSync(file)) {
            const fileType = await fileTypeFromFile(file)
            const newDestination = inputsDir + path.basename(file) + '.' + fileType.ext
            fs.renameSync(file, newDestination)
            postFiles.push(newDestination)
        }
    }

    return {
        password: form['password']?.[0],
        post: {
            text: form['post.text']?.[0],
            files: postFiles,
        },
        container: {
            file: containerFile,
            autosize: form['container.autosize']?.[0] === 'true',
        },
        sender: {
            PrivateKey: form['sender.PrivateKey']?.[0],
            PublicKey: form['sender.PublicKey']?.[0],
        },
        receiver: {
            PublicKey: form['receiver.PublicKey']?.[0],
        }
    }
}

export const validate = function (form, response) {
    if (!(form.container.file && fs.existsSync(form.container.file))) {
        response.writeHead(500)
        response.end('Container file is required field')

        return false
    }

    return true
}

export const inCaseOfError = function (error, response) {
    const uuid = crypto.randomUUID()
    console.error(uuid, error)
    response.writeHead(500)
    response.send('Error occurred during form submission, uuid: ' + uuid)
}
