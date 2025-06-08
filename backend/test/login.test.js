const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // your Express app (WITHOUT app.listen inside!)

let server;

before((done) => {
    // Start server before tests
    server = app.listen(3002, () => {
        console.log('Test server running');
        done();
    });
});

after((done) => {
    // Close server and DB after tests
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('Test server and DB closed');
            done();
        });
    });
});

describe('User Login', () => {
    it('should fail login with wrong credentials', async () => {
        await request(server)
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401);
    });
});
