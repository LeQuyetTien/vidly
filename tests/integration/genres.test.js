let request = require('supertest');
let mongoose = require('mongoose');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');

let server;

describe('/api/genres', () => {
  beforeEach(() => { server = require('../../index'); });
  afterEach(async () => {
    await server.close();
    await Genre.remove({});
    await User.remove({});
  });

  describe('GET /', () => {
    it('should return all genres', async () => {
      await Genre.collection.insertMany([
        { name: 'genre1' },
        { name: 'genre2' },
      ]);

      const res = await request(server).get('/api/genres');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
      expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('should return a genre if valid id is passed', async () => {
      const genre = new Genre({ name: 'genre1' });
      await genre.save();
  
      const res = await request(server).get('/api/genres/' + genre._id);
  
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', genre.name);
    });
    
    it('should return 404 if invalid id is passed', async () => {
      const res = await request(server).get('/api/genres/1');
  
      expect(res.status).toBe(404);
    });
    
    it('should return 404 if no genre with the given id exists', async () => {
      const id = mongoose.Types.ObjectId();
      const res = await request(server).get('/api/genres/' + id);
  
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    // Define the happy path, and then in each test, we change one parameter
    // that clearly aligns with  the name of the test.
    let token;
    let name;

    const exec = async () => {
      return await request(server)
        .post('/api/genres')
        .set('x-auth-token', token)
        .send({ name });
    }

    beforeEach(() => {
      token = new User().generateAuthToken();
      name = 'genre1';
    });

    it('should return 401 if client is not logged in', async () => {
      token = '';
      const res = await exec();

      expect(res.status).toBe(401);
    });
    
    it('should return 400 if genre is lest than 5 characters', async () => {
      name = '1234';
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre is more than 50 characters', async () => {
      name = new Array(52).join('a');
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should save the genre if it is valid', async () => {
      await exec();

      const genre = await Genre.find({ name: 'genre1' });

      expect(genre).not.toBeNull();
    });

    it('should return the genre if it is valid', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', 'genre1');
    });
  });

  describe('PUT /', () => {
    // Define the happy path, and then in each test, we change one parameter
    // that clearly aligns with  the name of the test.
    let token;
    let id;
    let name;

    const exec = async () => {
      return await request(server)
        .put('/api/genres/' + id)
        .set('x-auth-token', token)
        .send({ name });
    }

    beforeEach(async () => {
      token = new User().generateAuthToken();

      const genre = new Genre({
        name: 'genre1'
      });
      await genre.save();
      id = genre._id;

      name = 'new_genre';
    });
    
    it('should return 400 if genre is lest than 5 characters', async () => {
      name = '1234';
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if genre is more than 50 characters', async () => {
      name = new Array(52).join('a');
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 404 if id is invalid', async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();

      expect(res.status).toBe(404);
    });
    
    it('should return genre if valid', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('_id', id.toHexString());
      expect(res.body).toHaveProperty('name', name);
    });
  });

  describe('DELETE /', () => {
    it('should return 403 if user logged in is not admin', async () => {
      const genre = new Genre({
        name: 'genre1'
      });
      await genre.save();

      const user = new User({
        name: 'Tien Le',
        email: 'tien@ezactive.com',
        password: '12345',
        isAdmin: false,
      });
      await user.save();
      const token = user.generateAuthToken();

      const res = await request(server)
        .delete('/api/genres/' + genre._id)
        .set('x-auth-token', token);

      expect(res.status).toBe(403);      
    });
    
    it('should return 404 if invalid id is passed', async () => {
      const id = mongoose.Types.ObjectId().toHexString();

      const user = new User({
        name: 'Tien Le',
        email: 'tien@ezactive.com',
        password: '12345',
        isAdmin: true,
      });
      await user.save();
      const token = user.generateAuthToken();

      const res = await request(server)
        .delete('/api/genres/' + id)
        .set('x-auth-token', token);

      expect(res.status).toBe(404);      
    });

    it('should delete genre if token and id is valid', async () => {
      const genre = new Genre({
        name: 'genre1'
      });
      await genre.save();

      const user = new User({
        name: 'Tien Le',
        email: 'tien@ezactive.com',
        password: '12345',
        isAdmin: true,
      });
      await user.save();
      const token = user.generateAuthToken();

      const res = await request(server)
        .delete('/api/genres/' + genre._id)
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
    });
  });
});
