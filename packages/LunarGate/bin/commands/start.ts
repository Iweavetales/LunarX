import {spawn} from "child_process";
import {Command} from "commander";

export default async function Start(options: Record<any, any>) {



    console.log("options",process.argv, options, options )

    return new Promise((resolve, reject) => {
        if( options.runtime == "deno" ){
            let server = spawn('deno', [
                'run',

                'node_modules/lunargate-test-helloworld3/dist/denoRuntime/index.js'
            ]);

            server.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
            });

            server.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            server.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                resolve(true)
            });
        }
    })
}