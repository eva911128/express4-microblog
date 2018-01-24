var express = require('express');
var router = express.Router();
var db = require('../dbConfig');
var common = require('../common');
var crypto = require('crypto');//crypto模块的目的是为了提供通用的加密和哈希算法。

function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','用户未登录');
        return res.redirect('/login');
    }
    next();
}
function checkNotLogin(req,res,next){
    if(req.session.user) {
        req.flash('error','用户已登录');
        return res.redirect('/');
    }
    next();
}

/* GET home page. */
router.get('/', function(req, res, next) {
    db.query('select * from posts',function(err,data){
        if(err) {
            req.flash('error',err);
            data = [];
        }
        res.render('index', { title: '首页',posts: data});
    })
});
router.post('/post',function(req,res,next){
    var name = req.session.user.name;
    var content = req.body.post;
    var time = common.formatTime('yyyy-MM-dd HH:mm:ss');
    db.query('insert into posts (name,content,time) values ("'+name+'","'+content+'","'+time+'")',function(err,data){
        if(err) {
            req.flash('error',err);
            return res.redirect('/');
        }
        req.flash('success','发表成功');
        res.redirect('/u/'+ name);
    })
})
router.get('/u/:user',function(req,res,next){
    var name = req.params.user;
    console.log(name)
    db.query('select * from posts where name="'+name+'"',function(err,data){
        if(err) {
            req.flash('error',err);
            res.redirect('/');
        }
        if(data.length == 0) {
            req.flash('error','该用户不存在');
            res.redirect('/');
        }
        res.render('user',{
            title:name,
            posts:data
        });
    })
})


router.get('/register',checkNotLogin);
router.get('/register', function(req, res, next) {
    res.render('register', { title: '用户注册' });
});

router.get('/register',checkNotLogin);
router.post('/register', function(req, res, next) {
    var md5 = crypto.createHash('md5');
    var name = req.body.username;
    var pwd = md5.update(req.body.password).digest('hex');
    db.query('select * from user where name="'+name+'"',function(err,data){
        if(err) {//数据库出错
           req.flash('error',err);
            return res.redirect('/register');
        }
        if(data.length>0) {//如果用户存在
            req.flash('error','用户已存在');
            return res.redirect('/register');
        }

        //用户不存在
        db.query('insert into user (name,password) values("'+name+'","'+pwd+'")',function(_err,_data){
            if(_err) {//数据库出错
                req.flash('error','保存失败');
                return res.redirect('/reg');
            }
            //注册成功
            req.flash('success','保存成功');
            res.redirect('/');
        })
    })
});

router.get('/login',checkNotLogin);
router.get('/login', function(req, res, next) {
    res.render('login', { title: '用户登入' });

});

router.get('/login',checkNotLogin);
router.post('/login', function(req, res, next) {
    var md5 = crypto.createHash('md5');
    var name = req.body.username;
    var pwd = md5.update(req.body.password).digest('hex');
    db.query('select * from user where name="'+name+'" and password="'+pwd+'"',function(err,data){
        if(err){
            req.flash('error',err);
            return res.redirect('/login');
        }
        if(data.length == 0) {
            req.flash('error','账号信息错误');
            return res.redirect('/login');
        }
        req.session.user = data[0];
        req.flash('success','登入成功');
        return res.redirect('/');
    })
});

router.get('/logout',checkLogin);
router.get('/logout',function(req,res,next){
    req.session.user = null;
    req.flash('success','退出成功');
    res.redirect('/');
})
module.exports = router;
