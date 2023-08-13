#!node
import devCommand from '../utils/commands/dev'
import buildCommand from '../utils/commands/build'
import startCommand from '../utils/commands/start'

let lunarArgs = process.argv.slice(2)

enum LunarCommands {
    Build = "build",
    Dev = "dev",
    Start = "start"
}

function MatchingSpecificCommand(string: string) : LunarCommands | null {
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

let foundSomeCommand = lunarArgs.find((arg) => /^[a-z][A-Z]/)

if( foundSomeCommand !== undefined ){
    let lunarCmd = MatchingSpecificCommand(foundSomeCommand)
    if ( lunarCmd != null ){
        switch (lunarCmd) {
            case LunarCommands.Dev:
                devCommand(lunarArgs)
                break
            case LunarCommands.Build:
                buildCommand(lunarArgs)
                break
            case LunarCommands.Start:
                startCommand(lunarArgs)
                break
        }
    }
}
