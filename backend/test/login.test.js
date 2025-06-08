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
        await request(app)
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401);
    });

    it('should succeed login with correct credentials', async () => {
        await request(app)
            .post('/users/login')
            .send({ username: 'klada1', password: '123' })  // ✅ <-- replace with your real test user
            .expect(200);
    });
});
