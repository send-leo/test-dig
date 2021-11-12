'use strict'
const child_process = require('child_process');
const util = require('util');
const exec = util.promisify(child_process.exec);
const sleep = util.promisify((delay, func) => setTimeout(func, delay));

async function dig_ok({ domain, delay, ts_start }, host) {
    const cmd = host ? `dig ${domain} @${host}` : `dig ${domain}`;
    let cnt = 0;
    for (; ;) {
        const duration = (new Date() - ts_start) / 1000;
        const output = (await exec(cmd)).stdout;
        if (output.includes('ANSWER SECTION:')) {
            ++cnt;
            console.log(host, duration, 'ok', cnt);
            if (3 <= cnt)
                return { host, duration, output };
        }
        else {
            cnt = 0;
            console.log(host, duration, 'fail');
        }
        await sleep(delay);
    }
}

async function dig_fail({ domain, delay, ts_start }, host) {
    const cmd = host ? `dig ${domain} @${host}` : `dig ${domain}`;
    let cnt = 0;
    for (; ;) {
        const duration = (new Date() - ts_start) / 1000;
        const output = (await exec(cmd)).stdout;
        if (output.includes('ANSWER SECTION:')) {
            cnt = 0;
            console.log(host, duration, 'ok');
        }
        else {
            ++cnt;
            console.log(host, duration, 'fail', cnt);
            if (3 <= cnt)
                return { host, duration, output };
        }
        await sleep(delay);
    }
}

async function nslookup_ok({ domain, delay, ts_start }, host) {
    const cmd = host ? `nslookup ${domain} ${host}` : `nslookup ${domain}`;
    let cnt = 0;
    for (; ;) {
        const duration = (new Date() - ts_start) / 1000;
        try {
            const output = (await exec(cmd)).stdout;
            ++cnt;
            console.log(host, duration, 'ok', cnt);
            if (3 <= cnt)
                return { host, duration, output };
        }
        catch {
            cnt = 0;
            console.log(host, duration, 'fail');
        }
        await sleep(delay);
    }
}

async function nslookup_fail({ domain, delay, ts_start }, host) {
    const cmd = host ? `nslookup ${domain} ${host}` : `nslookup ${domain}`;
    let cnt = 0;
    for (; ;) {
        const duration = (new Date() - ts_start) / 1000;
        try {
            const output = (await exec(cmd)).stdout;
            cnt = 0;
            console.log(host, duration, 'ok');
        }
        catch (e) {
            ++cnt;
            console.log(host, duration, 'fail', cnt);
            if (3 <= cnt)
                return { host, duration, output: e.stdout };
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

    // const test = dig_ok;
    // const test = dig_fail;
    // const test = nslookup_ok;
    const test = nslookup_fail;

    const res = await Promise.all([
        test(opt, ''),
        test(opt, '8.8.8.8'),
        test(opt, '1.1.1.1'),
        test(opt, 'ns-616.awsdns-13.net'),
    ]);

    console.log();
    console.log();
    res.map(({ host, duration, output }) => {
        console.log('--------------------------------------');
        console.log(`${host}: ${duration}\n`);
        console.log(output);
        console.log();
    });
}

main();
