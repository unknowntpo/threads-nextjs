/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('username', 'testuser');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 409 when email already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user1',
          password: 'Password123!',
        })
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          username: 'user2',
          password: 'Password123!',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already exists');
        });
    });

    it('should return 409 when username already exists', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user1@example.com',
          username: 'duplicateuser',
          password: 'Password123!',
        })
        .expect(201);

      // Second registration with same username
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user2@example.com',
          username: 'duplicateuser',
          password: 'Password123!',
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Username already exists');
        });
    });
  });

  describe('/api/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'logintest@example.com',
        username: 'loginuser',
        password: 'Password123!',
      });
    });

    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(typeof res.body.accessToken).toBe('string');
          expect(res.body.accessToken.length).toBeGreaterThan(0);
        });
    });

    it('should return 401 with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should return 401 with invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'WrongPassword!',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });
  });

  describe('/api/auth/me (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create and login a user
      await request(app.getHttpServer()).post('/api/auth/register').send({
        email: 'metest@example.com',
        username: 'meuser',
        password: 'Password123!',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'metest@example.com',
          password: 'Password123!',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should return user data with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'metest@example.com');
          expect(res.body).toHaveProperty('username', 'meuser');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);
    });
  });
});
