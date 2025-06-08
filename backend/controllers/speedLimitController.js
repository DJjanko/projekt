var SpeedlimitModel = require('../models/speedLimitModel.js');

/**
 * speedLimitController.js
 *
 * @description :: Server-side logic for managing SpeedLimits.
 */
module.exports = {

    /**
     * SpeedLimitController.list()
     */
    list: function (req, res) {
        SpeedlimitModel.find(function (err, SpeedLimits) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting SpeedLimit.',
                    error: err
                });
            }

            return res.json(SpeedLimits);
        });
    },

    /**
     * SpeedLimitController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        SpeedlimitModel.findOne({_id: id}, function (err, SpeedLimit) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting SpeedLimit.',
                    error: err
                });
            }

            if (!SpeedLimit) {
                return res.status(404).json({
                    message: 'No such SpeedLimit'
                });
            }

            return res.json(SpeedLimit);
        });
    },

    /**
     * SpeedLimitController.create()
     */
    create: function (req, res) {
        var SpeedLimit = new SpeedlimitModel({
            id : req.body.id,
            latitude : req.body.latitude,
            longitude : req.body.longitude,
            speedLimit : req.body.speedLimit
        });

        SpeedLimit.save(function (err, SpeedLimit) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating SpeedLimit',
                    error: err
                });
            }

            return res.status(201).json(SpeedLimit);
        });
    },

    /**
     * SpeedLimitController.postMany()
     */
    postMany: async function (req, res) {
        try {
            const data = req.body;

            // Delete all existing data
            await SpeedlimitModel.deleteMany({});

            // Insert new data
            await SpeedlimitModel.insertMany(data, { ordered: false });

            return res.status(201).json({
                message: 'SpeedLimits refreshed successfully.',
                insertedCount: data.length
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: 'Error during refresh of SpeedLimits.',
                error: err
            });
        }
    }
    ,

    /**
     * SpeedLimitController.update()
     */
    update: function (req, res) {
        var id = req.params.id;

        SpeedlimitModel.findOne({_id: id}, function (err, SpeedLimit) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting SpeedLimit',
                    error: err
                });
            }

            if (!SpeedLimit) {
                return res.status(404).json({
                    message: 'No such SpeedLimit'
                });
            }

            SpeedLimit.id = req.body.id ? req.body.id : SpeedLimit.id;
            SpeedLimit.latitude = req.body.latitude ? req.body.latitude : SpeedLimit.latitude;
            SpeedLimit.longitude = req.body.longitude ? req.body.longitude : SpeedLimit.longitude;
            SpeedLimit.speedLimit = req.body.speedLimit ? req.body.speedLimit : SpeedLimit.speedLimit;

            SpeedLimit.save(function (err, SpeedLimit) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating SpeedLimit.',
                        error: err
                    });
                }

                return res.json(SpeedLimit);
            });
        });
    },

    /**
     * SpeedLimitController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;

        SpeedlimitModel.findByIdAndRemove(id, function (err, SpeedLimit) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the SpeedLimit.',
                    error: err
                });
            }

            return res.status(204).json();
        });
    }
};
