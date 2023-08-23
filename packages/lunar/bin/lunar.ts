#!/usr/bin/env node
import devCommand from "./commands/dev"
import buildCommand from "./commands/build"
import startCommand from "./commands/start"
import packageJSON from "../package.json"
import { Command } from "commander"
;(async function () {
  return new Promise((resolve, reject) => {
    const lunar = new Command()
    lunar.name(`lunar`)
    lunar.description(`${packageJSON.description}`)
    lunar.version(packageJSON.version)

    lunar
      .command("start")
      .description("Start built application")
      .option(
        "-r, --runtime <string>",
        "Select runtime for run application",
        "node"
      )
      .option("-b, --buildDir <string>", "locate built directory", "./dist")
      .option("-h, --help", "Show this")
      .action(async (options) => {
        await startCommand({
          runtime: options.runtime,
          buildDir: options.buildDir,
        })
        resolve(true)
      })

    lunar
      .command("dev")
      .description("Development lunar")
      .option("-b, --buildDir <string>", "locate built directory", "./dist")
      .action(async (options) => {
        await devCommand(options)
        resolve(true)
      })

    lunar
      .command("build")
      .description("build lunar application")
      .action(async (options) => {
        await buildCommand(options)
        resolve(true)
      })

    lunar.parse(process.argv)
  })
})()
