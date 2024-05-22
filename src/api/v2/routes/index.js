let express = require('express');
let router = express.Router();

var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

let bookRouter = require('./book.routes');
let userRouter = require('./user.routes');
let borrowRouter = require('./borrow.routes');
let authRouter = require('./auth.routes');

router.use('/books',csrfProtection, bookRouter);
router.use('/users' ,csrfProtection, userRouter);
router.use('/borrow',csrfProtection, borrowRouter);
router.use('/auth', authRouter);



module.exports = router;

