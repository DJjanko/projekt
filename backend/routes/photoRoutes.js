var express = require('express');
// Vključimo multer za file upload
var multer = require('multer');
var upload = multer({dest: 'public/images/'});


var router = express.Router();
var photoController = require('../controllers/photoController.js');

function requiresLogin(req, res, next){
    console.log('ok')
    if(req.session && req.session.userId){
        console.log('ok1')
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


router.post('/', requiresLogin, function (req, res, next) {
    upload.single('image')(req, res, function (err) {
        if (err) {
            console.error('❌ Multer error:', err);
            return res.status(500).json({ message: 'Upload failed', error: err.message });
        }
        next(); // Only go to controller if upload succeeded
    });
}, photoController.create);

router.post('/base64', requiresLogin, photoController.createFromBase64);



router.post('/:id/createComment', photoController.createComment);


router.put('/:id', photoController.update);

router.put('/:id/like', photoController.like);

router.delete('/:id', photoController.remove);

module.exports = router;
