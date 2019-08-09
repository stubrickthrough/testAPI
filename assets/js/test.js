layui.use(['layer', 'element'], function(){
    var $ = layui.jquery
    ,element = layui.element //Tab的切换功能，切换事件监听等，需要依赖element模块
    ,layer = layui.layer;
})

var active = {
    offset: function(othis, detailID){
        var errorDetail = detail[detailID];
        var content = "";

        if (errorDetail.hasOwnProperty("id")) { // include input and expect
            for (var obj in testcases) {
                if (testcases[obj].id == errorDetail['id']) {
                    content += '<div class="layui-card"><div class="layui-card-header"><span style="color: #449D54; font-weight:bold;">输入参数</span></div><div class="layui-card-body"><pre>'+testcases[obj].input+'</pre></div></div>';
                    content += '<div class="layui-card"><div class="layui-card-header"><span style="color: #449D54; font-weight:bold;">预期答案</span></div><div class="layui-card-body"><pre>'+testcases[obj].answer+'</pre></div></div>';
                    break;
                }
            }
        } 
        if (errorDetail.hasOwnProperty("error")) { // include error
            content += '<div class="layui-card"><div class="layui-card-header"><span style="color: #D04051; font-weight:bold;">发生错误</span></div><div class="layui-card-body"><pre>'+errorDetail['error']+'</pre></div></div>';
        } 
        if (errorDetail.hasOwnProperty("wa")) { // include error
            content += '<div class="layui-card"><div class="layui-card-header"><span style="color: #D04051; font-weight:bold;">你的答案</span></div><div class="layui-card-body"><pre>'+errorDetail['wa']+'</pre></div></div>';
        } 
        if (errorDetail.hasOwnProperty("ac")) { // include error
            content += '<div class="layui-card"><div class="layui-card-header"><span style="color: #449D54; font-weight:bold;">你的答案</span></div><div class="layui-card-body"><pre>'+errorDetail['ac']+'</pre></div></div>';
        }
        
        layer.open({
            type: 1
            ,area:"600px"
            ,maxHeight:441
            ,title: '错误信息详情'
            ,offset: 'auto' //具体配置参考：http://www.layui.com/doc/modules/layer.html#offset
            ,id: 'layerDemo'+'auto' //防止重复弹出
            ,content: '<div style="padding: 20px; background-color: #F2F2F2;">'+ content.replace(/\n/g, "<br>") +'</div>'
            ,btn: '关闭'
            ,btnAlign: 'c' //按钮居中
            ,shade: 0 //不显示遮罩
            ,yes: function(){
                layer.closeAll();
            }
        });
    }
};

var table = new Table({id:'testcase'});
table.initialize(function(tableObj){
    var col = [ //标题栏
            {field: 'id', title: 'ID', width: 80, sort: true}
            ,{field: 'description', title: '测试用例', minWidth: 120}
            ,{field: 'status', title: '状态', width: 250, templet: '#statusTpl', sort: true}
            ,{field: 'time', title: '提交时间', width: 160, sort: true}
            ,{field: 'detail', title: '详情', templet: '#detailTpl', width: 80, align:'center'}
            ]
    var ops = {
        elem: '#testResult'//自定义dom
        ,id:'testcase'
        ,data: []
        ,cols: [col]
        ,page: { layout: ['prev', 'page', 'next', 'count'] }
        ,limit: 20
    }
    table.rederTable(ops,function () {
        });					
})

// //data为行数据json
// table.updateRowItem(data,"id",function(data){
// 	//默认更新完的回调
// });

setProgress(1, 1);
var headcount = 0, bodycount = 0;
var detail = []
var curTime = null;
var report = {
    "time": "",
    "ac": 0,
    "wa": 0,
    "tle": 0,
    "re": 0,
    "ce": 0,
    "pe": 0
}

var editor = CodeMirror.fromTextArea(document.getElementById("textareaCode"), {
    lineNumbers: true,
    lineWrapping:true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    styleActiveLine: true,
    theme: "darcula",
    mode:  "text/x-csrc"
});

// init text for C
editor.setValue("#include <stdio.h>\n\nint main(void) { \n    // Warning: 'int main' is unchangeable! \n    // Otherwise it will cause Pre-Test Error.\n\n    // YOUR CODE HERE.\n    return 0;\n}");

var apiurl = "https://runcode-api2-ng.dooccn.com";

function setProgress(numerator, denominator) {
    layui.use('element', function(){
        $ = layui.jquery;
        element = layui.element; //Tab的切换功能，切换事件监听等，需要依赖element模块

        element.init();
        var percent = 100 * numerator / denominator;
        element.progress('curProgress', percent.toFixed(2) + '%');
        if (percent == 100) {
            $('#progressBar').text('');
        }
    })
}

function getCurTime() {
    var myDate = new Date();
    var curTime = myDate.toLocaleDateString() + " " + myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds();
    return curTime;
}

function stringConvert(str) {
    var num = Number(str.slice(19));
    var result = "/usercode/file.cpp:";
    if (num<=headcount) {
        result += num;
    } else if (num>(headcount+31) && num<=(headcount+31+bodycount)) {
        result += num-31;
    } else if (num>(headcount+31+bodycount+24)) {
        result += num-55;
    } else {
        result += '?'
    }
    return result;
}

function setStatusInfo(data) {
    var getTpl = statusInfo.innerHTML
    ,view = document.getElementById('curStatus');
    layui.use('laytpl', function(){
        var laytpl = layui.laytpl;
        laytpl(getTpl).render(data, function(html){
            view.innerHTML = html;
        });
    });
}

// Add row function.

function accept(id, detailID) {
    for (var obj in testcases) {
        if (testcases[obj].id == id) {
            var data = {
                "id": id
                ,"description": testcases[obj].description
                ,"time": curTime
                ,"status": "Accept"
                ,"detail": detailID
            }
            table.addRowItem(data);
            report.ac++;
            break;
        }
    }
}

function preTestError(detailID) {
    var data = {
        "id": '----'
        ,"description": "'int main' is unchangeable and should be put at the beginning!"
        ,"time": curTime
        ,"status": "Pre-Test Error"
        ,"detail": detailID
    }
    table.addRowItem(data);
    report.pe++;
}

function wrongAnswer(id, detailID) {
    for (var obj in testcases) {
        if (testcases[obj].id == id) {
            var data = {
                "id": id
                ,"description": testcases[obj].description
                ,"time": curTime
                ,"status": "Wrong Answer"
                ,"detail": detailID
            }
            table.addRowItem(data);
            report.wa++;
            break;
        }
    }
}

function runtimeError(id, detailID) {
    for (var obj in testcases) {
        if (testcases[obj].id == id) {
            var data = {
                "id": id
                ,"description": testcases[obj].description
                ,"time": curTime
                ,"status": "Runtime Error"
                ,"detail": detailID
            }
            table.addRowItem(data);
            report.re++;
            break;
        }
    }
}

function timeLimitExceeded(id, detailID) {
    for (var obj in testcases) {
        if (testcases[obj].id == id) {
            var data = {
                "id": id
                ,"description": testcases[obj].description
                ,"time": curTime
                ,"status": "Time Limit Exceeded"
                ,"detail": detailID
            }
            table.addRowItem(data);
            report.tle++;
            break;
        }
    }
}

function compileError(detailID) {
    var data = {
        "id": "----"
        ,"description": "Compile Error"
        ,"time": curTime
        ,"status": "Compile Error"
        ,"detail": detailID
    }
    table.addRowItem(data);
    report.ce++;		
}

// test function

function preTestProcess(code) {
    // TODO: processing the code.
    var headerNum = code.search('int main');
    if (headerNum == -1) {
        // Pre-Test Error: int main missing.
        var detailID = detail.push({
                        "error": "'int main' missing.<br>'int main'缺失。"
                    })
        preTestError(detailID-1);
        return "Error";
    }
    var header = code.slice(0, headerNum);
    headcount = header.match(/\n/g).length;

    var bodyNum = code.slice(headerNum).search('{');
    if (bodyNum == -1) {
        // Pre-Test Error: main function parentheses missing.
        var detailID = detail.push({
                        "error": "main function parentheses missing.<br>main函数左括号'{'缺失。"
                    })
        preTestError(detailID-1);
        return "Error";
    }
    var restPart = code.slice(headerNum).slice(bodyNum);
    var pcounter = 1;
    var currentPointer = 1;

    while (pcounter) {
        if (currentPointer == restPart.length){
            // Pre-Test Error: main function parentheses missing.
            var detailID = detail.push({
                        "error": "main function parentheses missing.<br>main函数右括号'}'缺失。"
                    })
            preTestError(detailID-1);
            return "Error";
        }

        if (restPart[currentPointer] == '{') {
            pcounter++;
        } else if (restPart[currentPointer] == '}') {
            pcounter--;
        }

        currentPointer++;
    }

    var body = restPart.slice(0, currentPointer);
    bodycount = body.match(/\n/g).length;
    var rest = restPart.slice(currentPointer);

    // Add the test code.

    code = header + "\n#include <stdio.h>\n#include <unistd.h>\n#include <signal.h>\n#include <sys/types.h>\n#include <sys/wait.h>\n#include <sys/time.h>\nvoid handle(int sig)\n{\n    if (sig == SIGCHLD)\n    {\n        int pid;\n        int status;\n        while((pid = waitpid(-1, &status, WNOHANG)) > 0){}\n    }\n}\n\nint main(int argc, char **argv)\n{\n    int timeLimit = "+ timeLimit * 1000000 +";\n    \n    pid_t pid;\n    int status;\n    \n    float time_use=0;\n struct timeval start;\n struct timeval end;//struct timezone tz; \n gettimeofday(&start,NULL); //gettimeofday(&start,&tz);\n \n \n    if(!(pid=fork()))\n"+
        body   + "    else\n    {   int ret;\n        signal(SIGCHLD, handle);\n        \n        while(1){\n            gettimeofday(&end,NULL);\n      time_use=(end.tv_sec-start.tv_sec)*1000000+(end.tv_usec-start.tv_usec);\n      \n      ret = kill(pid,0);\n            if (ret == 0) { // Child process is alive.\n                \n                if(time_use>=timeLimit) { // over the time limit\n           printf(\"Time Limit Exceeded\");\n           kill(pid, 6);\n                    break;\n          }\n                \n            } else {\n                break;\n            }      \n        }  \n    }\n    return 0;\n}\n"+
        rest;

    code = Base64.encode(code);
    return code;
}

function compileErrorTest(code, runcode) {
    // code in Base64
    $.ajax({    url: apiurl + "/compile2",
                type: "POST", 
                data: { code:code,stdin:compileInput,language:runcode }, 
                success: function (data, error, xhr) {
                    var output = data.output.replace("\r\n\r\n官方网站:http://www.dooccn.com",'').trim();
                    if (output == "Compilation Failed") {
                        var detailID = detail.push({
                                    "error": data.errors.replace(/\/usercode\/file.cpp:\d{1,}/g,stringConvert)
                                })
                        compileError(detailID-1);
                        setProgress(2, 2);
                        btn[0].className = "primary";
                        setStatusInfo({"status":"finished", "content":report});
                    } else {
                        setProgress(2, testcases.length+2);
                        caseTest(code, 0);
                    }
                },
                error: function (error) {
                    setProgress(2, 2);
                    btn[0].className = "primary";
                    setStatusInfo({"status":"error", "content":error.statusText});
                } 
    });
}

function caseTest (code, index) {
    // code in Base64
    var stdin = testcases[index].input;
    setStatusInfo({"status":"processing", "content":"正在进行：样例测试  ID:"+testcases[index].id+"..."});

    setTimeout(function(){
        $.ajax({    url: apiurl + "/compile2",
                    type: "POST", 
                    data: { code:code,stdin:stdin,language:runcode }, 
                    success: function (data, error, xhr) {
                        var output = data.output.replace("\r\n\r\n官方网站:http://www.dooccn.com",'').trim();
                        var answer = testcases[index].answer.trim();
                        var id = testcases[index].id;
                        if (output == "Compilation Failed") {
                            var detailID = detail.push({
                                        "error": data.errors.replace(/\/usercode\/file.cpp:\d{1,}/g,stringConvert)
                                    })
                            compileError(detailID-1);
                        } else if (data.errors) {
                            var detailID = detail.push({
                                        "id": id,
                                        "error": data.errors.replace(/\/usercode\/file.cpp:\d{1,}/g,stringConvert)
                                    })
                            runtimeError(id, detailID-1);
                        } else if (output == "Time Limit Exceeded" || output == "Execution Timed Out") {
                            var detailID = detail.push({
                                        "id": id,
                                        "error": "The time limit is 1s."
                                    })
                            timeLimitExceeded(id, detailID-1);
                        } else if (output == answer) {
                            var detailID = detail.push({
                                        "id": id,
                                        "ac": output
                                    })
                            accept(id, detailID-1);
                        } else {
                            var detailID = detail.push({
                                        "id": id,
                                        "wa": output
                                    })
                            wrongAnswer(id, detailID-1);
                        }

                        index++;
                        setProgress(index+2, testcases.length+2);
                        if (index < testcases.length) {
                            caseTest(code, index);
                        } else {
                            setStatusInfo({"status":"finished", "content":report});
                            setTimeout(function(){
                                btn[0].className = "primary";
                            }, 10*1000);
                        }
                    } 
        });
    }, timeLimit*1000);
}

btn = $("#submitBTN");
btn.click(function() {
    btn[0].className = "primary disabled";
    curTime = getCurTime();
    report = {
        "time": curTime, "ac": 0, "wa": 0, "tle": 0, "re": 0, "ce": 0, "pe": 0
    }

    setProgress(0, testcases.length+2);
    setStatusInfo({"status":"processing", "content":"正在进行：预先检查..."});

    setTimeout(function(){

        code = editor.getValue();
        code = preTestProcess(code);
        if (code == "Error") {
            setProgress(1, 1);
            btn[0].className = "primary";
            setStatusInfo({"status":"finished", "content":report});
            return;
        } else {
            setProgress(1, testcases.length+2);
            setStatusInfo({"status":"processing", "content":"正在进行：编译..."});
        }

        setTimeout(function(){
            compileErrorTest(code, runcode);
        }, timeLimit*1000);
    }, 1*1000);
});