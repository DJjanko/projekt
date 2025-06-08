const request = require('supertest');
const app = require('../app');  // adjust the path depending on where your app.js is

describe('User Login', () => {
    it('should fail login with wrong credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401)
            .end(done);
    });

    // You can add more tests for successful login, etc.
});