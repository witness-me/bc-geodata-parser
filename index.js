const fs = require("fs")
const https = require("https")
const axios = require("axios")
const cheerio = require("cheerio")

parseFolders()

async function parseFolders() {
    let directoryFiles = fs.readdirSync("files/") // get list of available files
    console.log(directoryFiles.length, "files available")

    const baseURL = "https://pub.data.gov.bc.ca/datasets/175624/"

    const parentPage = await axios.get(baseURL)
    const $ = cheerio.load(parentPage.data)

    const foldersLinkElements = $("a")
    let foldersList = []
    for (let i = 0; i < foldersLinkElements.length; i++) {
        let text = $(foldersLinkElements[i]).text()
        if (text.includes("/")) {
            foldersList.push(text)
        }
    }

    for (let i = 0; i < foldersList.length; i++) {
        const subfolder = baseURL + foldersList[i]
        const childPage = await axios.get(subfolder)
        const $ = cheerio.load(childPage.data)
        const filesLinkElements = $("a")
        let filesList = []
        for (let i = 0; i < filesLinkElements.length; i++) {
            let text = $(filesLinkElements[i]).text()
            if (text.includes(".zip") && !text.includes(".md5")) {
                filesList.push(text)
            }
        }

        for (let i = 0; i < filesList.length; i++) {
            if (!directoryFiles.includes(filesList[i])) {
                const fileLink = subfolder + filesList[i]
                https.get(fileLink, async res => {
                    const path = `${__dirname}/files/${filesList[i]}`
                    const filePath = fs.createWriteStream(path)
                    res.pipe(filePath)
                    filePath.on("finish", async () => {
                        filePath.close()
                    })
                })
            }
        }
    }
}
