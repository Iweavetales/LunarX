#!/usr/bin/env node
import devCommand from "./commands/dev"
import buildCommand from "./commands/build"
import startCommand from "./commands/start"
import { Command } from "commander"

const lunarArgs = process.argv.slice(2)

enum LunarCommands {
  Build = "build",
  Dev = "dev",
  Start = "start",
}

function MatchingSpecificCommand(string: string): LunarCommands | null {
  switch (string) {
    case LunarCommands.Dev:
      return LunarCommands.Dev
    case LunarCommands.Start:
      return LunarCommands.Start
    case LunarCommands.Build:
      return LunarCommands.Build
  }

  return null
}

const foundSomeCommand = lunarArgs.find((arg) => /^[a-zA-Z]+$/.test(arg))

;(async function () {
  return new Promise((resolve, reject) => {
    const lunar = new Command()
    lunar
      .command("start")
      .description("Start built application")
      .option(
        "-r, --runtime <string>",
        "Select runtime for run application",
        "deno"
      )
      .option("-b, --builtDir <string>", "locate built directory", "./dist")
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
