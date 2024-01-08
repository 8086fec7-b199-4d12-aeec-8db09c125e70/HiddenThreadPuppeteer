import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import lodash from 'lodash'
import xml2js from 'xml2js'

const downloadPath = '/tmp/results/'
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, {recursive: true});
}

const dtoFieldMap = {
    strings: {
        'encode.password': '#hiddenThreadPassword',
        'encode.post.text': '#hiddenPostInput',
        'encode.sender.PrivateKey': '#privateKey',
        'encode.sender.PublicKey': '#publicKey',
        'encode.receiver.PublicKey': '#otherPublicKey',
        'decode.password': '#hiddenThreadPasswordDecode',
        'decode.receiver.PublicKey': '#privateKeyDecode',
    },
    files: {
        'encode.post.files': '#hiddenFilesInput',
        'encode.container.file': '#hiddenContainerInput',
        'decode.container.file': '#hiddenContainerInputDecode',
    },
    checkboxes: {
        'encode.container.autosize': '#isDataRatioLimited',
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms))

export default class HiddenThreadForm {
    #form
    #page

    constructor() {
        this.#page = new Promise(async function (resolve) {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--remote-debugging-port=9222',
                    '--remote-allow-origins=*',
                ]
            })
            const cdpSession = await browser.target().createCDPSession()
            await cdpSession.send('Browser.setDownloadBehavior', {behavior: 'allow', downloadPath});
            const page = await browser.newPage();
            await page.goto('https://anon25519.github.io/hiddenthread/standalone/hiddenthread_standalone.html');
            await page.evaluate(function () {
                // Instead of handling possible alerts disable them
                alert = console.log
            })

            resolve(page)
        })
    }

    /**
     * @param {Object} form
     * @returns {HiddenThreadForm}
     */
    fill(form) {
        const checkboxes = dtoFieldMap.checkboxes ?? []
        const files = dtoFieldMap.files ?? []
        const strings = dtoFieldMap.strings ?? []
        const promises = []

        for (const xpath of Object.keys(checkboxes)) {
            const value = lodash.get(form, xpath, null)
            if (typeof value === 'boolean') {
                const field = checkboxes[xpath]
                const promise = new Promise(async (resolve) => {
                    const page = await this.#page
                    await page.evaluate(function ({field, value}) {
                        document.querySelector(field).checked = value
                    }, {field, value})
                    resolve()
                })
                promises.push(promise)
            }
        }

        for (const xpath of Object.keys(files)) {
            const value = lodash.get(form, xpath, null)
            if (value && fs.existsSync(value)) {
                const field = files[xpath]
                const promise = new Promise(async resolve => {
                        const page = await this.#page
                        const fileInput = await page.$(field)
                        await fileInput.uploadFile(value)
                        resolve()
                    }
                );
                promises.push(promise)
            }
        }

        for (const xpath of Object.keys(strings)) {
            const value = lodash.get(form, xpath, null)
            if (typeof value === 'string' || value instanceof String) {
                const field = strings[xpath]
                const promise = new Promise(async (resolve) => {
                    const page = await this.#page
                    await page.evaluate(function ({field, value}) {
                        document.querySelector(field).value = value
                    }, {field, value})
                    resolve()
                })
                promises.push(promise)
            }
        }

        this.#form = new Promise(
            resolve => Promise
                .all(promises)
                .then(() => resolve(form))
        )

        return this
    }

    /**
     * @returns {Promise<{date: String, images: String[], text: String}>}
     */
    async decode() {
        const form = await this.#form
        const page = await this.#page
        const filePath = form.decode.container.file

        if (!(filePath && fs.existsSync(filePath))) {
            throw new Error('`dto.container.file` field is required and must be valid filepath')
        }

        await page.click('#hiddenDecodeButton');
        await delay(3000) // TODO awaits to encode finishes, 2lz to create observers
        let decodedPost = await page.evaluate(() => document.querySelector('#decodedPost').innerHTML)
        decodedPost = decodedPost.replaceAll('<br>', '');
        const browser = await page.browser()
        await browser.close();
        decodedPost = await xml2js.parseStringPromise(decodedPost)
        const text = lodash.get(decodedPost, 'div.article[0].div[1]', null)
        const date = lodash.get(decodedPost, 'div.article[0].div[0].div[0]', null)
        const images = [] // TODO Standalone app seems to not able to decode and encode file applications

        return {text, date, images}
    }

    /**
     * @returns {Promise<string>}
     */
    async encode() {
        const form = await this.#form
        const page = await this.#page
        const filePath = form.encode.container.file

        if (!(filePath && fs.existsSync(filePath))) {
            throw new Error('`dto.container.file` field is required and must be valid filepath')
        }

        await page.click('#createHiddenPostButton');
        await delay(3000) // TODO awaits to encode finishes, 2lz to create observers
        await page.click('a')
        await delay(3000) // TODO awaits to download finishes, 2lz to create observers
        const browser = await page.browser()
        await browser.close();

        return downloadPath + path.basename(filePath, path.extname(filePath)) + '.png'
    }

    async genKeys() {
        const page = await this.#page
        await page.click('#generateKeyPairButton')
        await delay(100) // TODO awaits to generation finishes, 2lz to create observers
        const privateKey = await page.evaluate(() => document.querySelector('#privateKey').value)
        const publicKey = await page.evaluate(() => document.querySelector('#publicKey').value)

        return {privateKey, publicKey}
    }
}
