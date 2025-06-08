const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // your Express app (without app.listen)

after((done) => {
    // Close DB after tests
    mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        done();
        process.exit(0);
    });
});

describe('User Login', () => {
    it('should fail login with wrong credentials', async () => {
        await request(app)  // 🟢 notice: directly pass app, no server.listen!
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401);
    });
});
