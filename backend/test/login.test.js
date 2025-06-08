const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');  // Import mongoose

describe('User Login', () => {
    after(() => {
        // Close mongoose connection after tests finish
        mongoose.connection.close();
    });

    it('should fail login with wrong credentials', async () => {
        await request(app)
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401);
    });
});
