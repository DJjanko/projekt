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

describe('User Profile', () => {
  it('should return user profile if user exists', async () => {
    // Replace with an actual user _id from your DB!
    const existingUserId = '68432f3a5ba1a6eb725e0a06';

    const res = await request(app)
        .get(`/users/${existingUserId}`)
        .expect(200);

    // Optionally check that correct user returned
    if (res.body && res.body._id) {
      if (res.body._id !== existingUserId) {
        throw new Error(`Expected user id ${existingUserId}, got ${res.body._id}`);
      }
    } else {
      throw new Error('Response body does not contain _id');
    }
  });

  it('should return 404 if user does not exist', async () => {
    const nonExistingId = new mongoose.Types.ObjectId();

    await request(app)
        .get(`/users/${nonExistingId}`)
        .expect(404);
  });
});
