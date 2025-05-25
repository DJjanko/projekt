var express = require('express');
// Vključimo multer za file upload
var multer = require('multer');
var upload = multer({dest: 'public/images/'});

var router = express.Router();
var photoController = require('../controllers/photoController.js');

function requiresLogin(req, res, next){
    if(req.session && req.session.userId){
        return next();
    } else{
        var err = new Error("You must be logged in to view this page");
        err.status = 401;
        return next(err);
    }
}

router.get('/', photoController.list);
//router.get('/publish', requiresLogin, photoController.publish);
router.get('/:id', photoController.show);

router.get('/:id/comments', photoController.comments);

router.post('/', requiresLogin, upload.single('image'), photoController.create);

router.post('/:id/createComment', photoController.createComment);

router.put('/:id', photoController.update);

router.put('/:id/like', photoController.like);

router.delete('/:id', photoController.remove);

router.delete('/:id/comments/:id_comment', photoController.deleteComment);

module.exports = router;
