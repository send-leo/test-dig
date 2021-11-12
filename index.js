'use strict'
const child_process = require('child_process');
const util = require('util');
const exec = util.promisify(child_process.exec);
const sleep = util.promisify((delay, func) => setTimeout(func, delay));

async function dig({ domain, delay, ts_start }, host) {
    const cmd = host ? `dig ${domain} @${host}` : `dig ${domain}`;
    let ok = 0;
    for (; ;) {
        const output = (await exec(cmd)).stdout;
        const duration = (new Date() - ts_start) / 1000;

        if (output.includes('ANSWER SECTION:')) {
            ++ok;
            console.log(host, duration, 'ok', ok);
            if (3 <= ok)
                return { host, duration, output };
        }
        else {
            ok = 0;
            console.log(host, duration, 'fail');
        }
        await sleep(delay);
    }
}

async function main() {
    const opt = {
        domain: 'leo.sendbirdtest.com',
        delay: 1000,
        ts_start: new Date(),
    };

    const res = await Promise.all([
        dig(opt, ''),
        dig(opt, '8.8.8.8'),
        dig(opt, '1.1.1.1'),
        dig(opt, 'ns-616.awsdns-13.net'),
    ]);

    console.log();
    console.log();
    res.map(({ host, duration, output }) => {
        console.log('--------------------------------------');
        console.log(host, duration);
        console.log(output);
        console.log();
    });
}

main();
