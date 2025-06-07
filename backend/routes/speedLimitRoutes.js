var express = require('express');
var router = express.Router();
var SpeedLimitController = require('../controllers/speedLimitController.js');

/*
 * GET
 */
router.get('/', SpeedLimitController.list);

/*
 * GET
 */
router.get('/:id', SpeedLimitController.show);

/*
 * POST
 */
router.post('/', SpeedLimitController.create);
router.post('/postMany', SpeedLimitController.postMany);

/*
 * PUT
 */
router.put('/:id', SpeedLimitController.update);

/*
 * DELETE
 */
router.delete('/:id', SpeedLimitController.remove);

module.exports = router;
