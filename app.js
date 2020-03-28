const request = require("sync-request");
const crypto = require("crypto");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/* 打印程序信息 */
log.write("**********************************************", "MAIN THREAD", "INFO");
log.write("*     小米路由器Mesh 双频合一禁用器 v0.0.1     *", "MAIN THREAD", "INFO");
log.write("*             Written In Node.js             *", "MAIN THREAD", "INFO");
log.write("*              Build:2020.03.28              *", "MAIN THREAD", "INFO");
log.write("*              Author: Runc2333              *", "MAIN THREAD", "INFO");
log.write("**********************************************", "MAIN THREAD", "INFO");

rl.question("请输入阁下的路由器IP地址, 通常为192.168.31.1\n路由器IP地址: ", (ipaddr) => {
    // console.log(`您输入的IP地址是: ${ipaddr}`);
    rl.question("请输入阁下的路由器管理员密码\n路由器管理员密码: ", (password) => {
        // console.log(`您输入的管理员密码是: ${password}`);
        console.log("已收集必要信息, 正在尝试从路由器获取登录必须的Key...");
        var url = `http://${ipaddr}/cgi-bin/luci/web/home`;
        try {
            var res = request("GET", url);
        } catch (e) {
            console.log("无法从路由器获取登录必须的Key, 请检查输入的路由器地址是否正确.");
            process.exit();
        }
        if (res.statusCode !== 200) {
            console.log("无法从路由器获取登录必须的Key, 请检查输入的路由器地址是否正确.");
            process.exit();
        }
        var response = res.getBody("utf8");
        console.log("已成功从路由器获取到Key, 正在生成用于登陆的sha1字符串...");
        var key = /(?<=key: ').*?(?=',)/.exec(response);
        delete res, response;
        var mac = /(?<=var deviceId = ').*?(?=';)/.exec(response);
        var rand = parseInt(Math.random() * (10000 - 1000 + 1) + 1000, 10);
        var time = Math.round(new Date().getTime() / 1000);
        var nonce = `0_${mac}_${time}_${rand}`;
        var psw0 = crypto.createHash("sha1").update(`${password}${key}`).digest('hex');
        var psw1 = crypto.createHash("sha1").update(`${nonce}${psw0}`).digest('hex');
        delete mac, rand, time, psw0;
        console.log(nonce);
        console.log(password);
        console.log(`已生成sha1字符串: ${psw1}`);
        console.log(`正在尝试从路由器获取Token...`);
        var url = `http://${ipaddr}/cgi-bin/luci/api/xqsystem/login`;
        var data = `username=admin&password=${encodeURIComponent(psw1)}&logtype=2&nonce=${encodeURIComponent(nonce)}`;
        // console.log(data);
        try {
            var res = request("POST", url, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: data
            });
        } catch (e) {
            console.log("从路由器获取Token时出现网络错误, 网络环境是否发生变化?");
            process.exit();
        }
        if (res.statusCode !== 200) {
            console.log("无法从路由器获取Token, 请检查输入的管理员密码是否正确.");
            process.exit();
        }
        var response = JSON.parse(res.getBody("utf8"));
        if (response.code !== 0) {
            console.log(response);
            console.log("无法从路由器获取Token, 请检查输入的管理员密码是否正确.");
            process.exit();
        }
        var token = response.token;
        console.log(`已成功获取Token: ${token}`);
        delete res, response, data, psw1, nonce;
        var url = `http://${ipaddr}/cgi-bin/luci/;stok=${token}/api/xqnetwork/wifi_detail_all`;
        try {
            var res = request("GET", url);
        } catch (e) {
            console.log("从路由器获取当前配置信息时出现错误, 网络环境是否发生变化?");
            process.exit();
        }
        if (res.statusCode !== 200) {
            console.log("无法从路由器获取当前配置信息, 请在群内反馈Bug.");
            process.exit();
        }
        var response = JSON.parse(res.getBody("utf8"));
        if (response.code !== 0) {
            console.log(response);
            console.log("无法从路由器获取当前配置信息, 请在群内反馈Bug.");
            process.exit();
        }
        var bsd = response.bsd;
        var ssid1 = response.info[0].ssid;
        var encryption1 = response.info[0].encryption;
        var on1 = 1;
        var channel1 = 0;
        var bandwidth1 = 0;
        var hidden1 = response.info[0].hidden;
        var txpwr1 = response.info[0].txpwr;
        var pwd1 = response.info[0].password;
        var on2 = 1;
        var channel2 = 0;
        var bandwidth2 = 0;
        var ssid2 = response.info[1].ssid;
        var encryption2 = response.info[1].encryption;
        var hidden2 = response.info[1].hidden;
        var txpwr2 = response.info[1].txpwr;
        var pwd2 = response.info[1].password;
        rl.question("已完成所有必要步骤, 现在关闭双频合一吗?\n(Y/N): ", (answer) => {
            if (answer === "N" || answer === "n") {
                console.log("取消执行, 正在退出...");
                process.exit();
            } else if (answer === "Y" || answer === "y") {
                console.log(`将为阁下关闭路由器的双频合一功能, 并将5G SSID重命名为<${ssid2}_5G>`)
                bsd = 0;
                ssid2 = `${ssid2}_5G`;
                console.log("正在尝试提交参数...");
                var url = `http://${ipaddr}/cgi-bin/luci/;stok=${token}/api/xqnetwork/set_all_wifi`;
                var data = `bsd=${encodeURIComponent(bsd)}&ssid1=${encodeURIComponent(ssid1)}&encryption1=${encodeURIComponent(encryption1)}&on1=${encodeURIComponent(on1)}&channel1=${encodeURIComponent(channel1)}&bandwidth1=${encodeURIComponent(bandwidth1)}&hidden1=${encodeURIComponent(hidden1)}&txpwr1=${encodeURIComponent(txpwr1)}&pwd1=${encodeURIComponent(pwd1)}&on2=${encodeURIComponent(on2)}&channel2=${encodeURIComponent(channel2)}&bandwidth2=${encodeURIComponent(bandwidth2)}&ssid2=${encodeURIComponent(ssid2)}&encryption2=${encodeURIComponent(encryption2)}&sshidden2id1=${encodeURIComponent(hidden2)}&txpwr2=${encodeURIComponent(txpwr2)}&pwd2=${encodeURIComponent(pwd2)}`;
                // console.log(data);
                try {
                    var res = request("POST", url, {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                        },
                        body: data
                    });
                } catch (e) {
                    console.log("提交参数时出现网络错误, 网络环境是否发生变化?");
                    process.exit();
                }
                if (res.statusCode !== 200) {
                    console.log("无法提交参数, 请在群内反馈Bug.");
                    process.exit();
                }
                var response = JSON.parse(res.getBody("utf8"));
                if (response.code !== 0) {
                    console.log("无法提交参数, 请在群内反馈Bug.");
                    process.exit();
                }
                console.log("已成功提交参数, 请等待路由器重启.");
                console.log("感谢使用!");
                process.exit();
            }
        });
    });
});