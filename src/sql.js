var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  port:"3306",
  user     : 'root',
  password : 'linlin1314',
  database : 'USVJH'
});

//连接数据库
function connectSql(){
  connection.connect();
}
//创建user表
function creatUserTbl(){
  let creatTbl =
  "CREATE TABLE IF NOT EXISTS `user_tbl`( `user_id` INT UNSIGNED AUTO_INCREMENT,`user_name` VARCHAR(50) NOT NULL unique, `user_pass` VARCHAR(50) NOT NULL,PRIMARY KEY ( `user_id` ))ENGINE=InnoDB DEFAULT CHARSET=utf8";
  connection.query(creatTbl, function(err, result) {
  if (err) {
    console.log("[INSERT ERROR] - ", err.message);
    return;
  }
});
}
//向user表中插入数据
function addToUser(addData){
  var addSql = "INSERT INTO user_tbl(user_name,user_pass) VALUES(?,?)";
  var addSqlParams = [addData.username, addData.userpass];
  const promise=new Promise(function(resolve,reject){
    connection.query(addSql, addSqlParams, function(err, result) {
      if (err) {
        reject(err);
        console.log(err.message);
      }
      else{
        resolve(result); 
      }
      
    });
  });
  return promise;
}
//根据用户名查询用户记录
function findOne(name){
  var selectSql = "SELECT * FROM user_tbl WHERE user_name="+"'"+name+"'";
  const promise=new Promise(function (resolve,reject){
    connection.query(selectSql, function(err, result) {  
      if(err){
        reject(err);
      }
      else{
      if(result.length>0){
        resolve(result);
      }else{
        reject(err);
      }
      }
    });

  });
  return promise;
 
}
//查看整个user表的数据
function getUserData(){
  var selectTbl = "SELECT * FROM user_tbl";
  connection.query(selectTbl, function(err, result) {
    if (err) {
      console.log("[SELECT ERROR] - ", err.message);
      return;
    }
    console.log(result);
  });
}

module.exports={
  sql:connection,
  connectSql:connectSql,
  creatUserTbl:creatUserTbl,
  addToUser:addToUser,
  findOne:findOne,
  getUserData:getUserData
}