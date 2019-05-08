var express = require("express");
var sqlObj = require("./src/sql");
var fs = require("fs");
var app = express();
var path = require("path");
var multiparty = require("multiparty"); //表单提交的multipart/form-data类型的数据
var session = require("express-session");
var visitedCount=0;
// var NedbStore = require('nedb-session-store')( session );//使用nedb存储session
var SessionStore = require('express-mysql-session');//使用mysql存储session
//连接数据库
sqlObj.connectSql();
//设置session
var options = {
  host     : 'localhost',
  port:"3306",
  user     : 'root',
  password : 'linlin1314',
  database : 'USVJH'
};
var cookieParser = require("cookie-parser");
app.use(cookieParser("1234"));
//session 设置
app.use(
session({
  // store: new NedbStore(
  //   {
  //     filename: 'nedb_session_file.db'
  //   }
  // ),
  store: new  SessionStore(options),
  secret: "1234", //加密的字符串，里面内容可以随便写
  name:"user",
  cookie: {maxAge:60 * 1000 * 60 * 24 * 14},
  rolling:true,
  resave: false, //强制保存session,即使它没变化
  saveUninitialized: true ,//强制将未初始化的session存储，默认为true
})
);

//创建user表
sqlObj.creatUserTbl();

//用于接受post请求发送来的数据
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

var application_root = __dirname;
app.use(express.static(path.join(application_root, "dist")));
app.listen(3000, function() {
  console.log("成功");
});

// app.all("*",function(req,res){
//   res.header("Cache-Control", "no-cache");
//   res.header("Expires", "0");
// });

app.get("/dataFile/anchor.json", function(req, res) {

  var pathname = req.path; //获取请求的文件的路径
  var queryObj; //获取查询参数已确定要进行的文件操作
  queryObj = req.query;
  //读文件
  var readData, readDataArr; //从文件中读取到的数据，格式为字符串
  fs.readFile(__dirname + pathname, function(err, data) {
    if (err) {
      return console.error(err);
    } else {
      readData = data.toString();
      if (readData.length > 0) {
        readDataArr = JSON.parse(readData);
      }
      //删除全部
      if (queryObj.delete == "all") {
        res.setHeader("Content-Type", "text/plain;charset=utf-8");
        res.send("get成功");
        let writeDataArr = [];
        var str = JSON.stringify(writeDataArr);
        //将操作后的数据重新写入json文件中
        fs.writeFile(__dirname + pathname, str, function(err) {
          if (err) {
            console.log("write Error" + err);
          } else {
            console.log("write ok.");
          }
        });
      }
      //添加全部
      if (queryObj.add == "all") {
        res.setHeader("Content-Type", "application/json;charset=utf-8");
        res.send(readDataArr);
      }
      //
    }
  }); //读取该json文件
});
/*
根据登陆后的sessionId,返回当前用户名
*/
app.get("/mainmap", function(req, res) {
  let id=req.sessionID;
        req.sessionStore.get(id,function(err,session){
          if(!err){
           if(session.user){
            res.setHeader("Content-Type", "text/plain;charset=utf-8");
            let str1=session.user.username[0];
            if(str1){
              res.send(str1);
            }
           else{
             res.end("");
           }
           }
          }  
         });
})
/*
 * 处理登录表单提交的数据
 */
app.post("/login", function(req, res) {
  var form = new multiparty.Form(); //创建form表单对象的实例
  form.parse(req, function(err, fields, files) {
    var name = fields.username;
    var pass = fields.userpass;
    //查询数据库里是否有该用户？
    var findResult = sqlObj.findOne(name);
    console.log("name",name);
    findResult.then(
      function(value) {
        console.log("success");
        const userMes = value[0];
        if (userMes.user_pass != pass) {
          res.send("密码错误");
        }
        else{
          res.redirect("mainmap.html");
          //存进session
    req.session.user= { username: name, userpass: pass };
    req.session.save();
        }
      },
      function(error) {
        console.log("error");
        res.send("用户不存在");
      }
    );
    
    
  });
});

/*
 * 处理注册表单提交的数据
 */
app.post("/signup", function(req, res) {
  var form = new multiparty.Form(); //创建form表单对象的实例
  var formData;
  form.parse(req, function(err, fields, files) {
    formData = fields;
    //向user表中添插入数据
    var addResult = sqlObj.addToUser(formData);
    addResult.then(
      function(value) {
        res.redirect("complete_signup.html");
        console.log("INSERT ID:", value);
      },
      function(error) {
        res.send("用户名已存在");
      }
    );
  });
});

//post请求
app.post("/dataFile/anchor.json", function(req, res) {
  //请求头中content-type为aplication/json,express通过引入模块可以将其正确解析为json格式
  //console.log(typeof(req.body));//为对象
  res.send("post成功");
  //console.log(req.sessionID);

   console.log(req.signedCookies.user);
  var pathname = req.path; //获取请求的文件的路径
  //将操作后的数据重新写入json文件中
  var str = JSON.stringify(req.body);
  fs.writeFile(__dirname + pathname, str, function(err) {
    if (err) {
      console.log("write Error" + err);
    } else {
      console.log("write ok.");
    }
  });
});


/*
 * 验证用户是否登录
*/
function loginState(cookieId,sessionId){
if(cookieId==sessionId){
return 1;
}
else{
  return 0;
}
}
/*
1.sessionID是根据什么得到的？
2.所以要根据sessionID=cookieID
还是get（sessionId）存在user信息？判断用户已登录？
*/
