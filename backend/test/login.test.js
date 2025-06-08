const request = require('supertest');
const app = require('../app');

describe('User Login', () => {
    it('should fail login with wrong credentials', (done) => {
        request(app)
            .post('/users/login')
            .send({ username: 'nonexistent', password: 'wrongpass' })
            .expect(401)
            .end((err, res) => {
                if (err) return done(err);
                done();
            });
    });
});
