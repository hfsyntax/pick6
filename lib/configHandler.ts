import {readFileSync, writeFileSync} from "fs"
import {EOL} from "os"
import { dirname, resolve } from "path"
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFilePath = resolve(dirname(__dirname), ".env")
const readEnvVars = () => readFileSync(envFilePath, "utf-8").split(EOL)

export const getEnvValue = (key: string) => {
    const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key)
    return matchedLine !== undefined ? matchedLine.split("=")[1] : null
}

export const setEnvValue = (key: string, value: string|number) => {
    const envVars = readEnvVars()
    const targetLine = envVars.find((line) => line.split("=")[0] === key)
    if (targetLine !== undefined) {
        const targetLineIndex = envVars.indexOf(targetLine)
        envVars.splice(targetLineIndex, 1, `${key}=${value}`)
    }
    writeFileSync(envFilePath, envVars.join(EOL))
}