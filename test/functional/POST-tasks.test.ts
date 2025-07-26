import { PrismaClient } from '../../src/datasources/prisma-clients/schema';
import { exec } from 'child_process';
import request from 'supertest';
import { promisify } from 'util';

const execAsync = promisify(exec);

const prisma = new PrismaClient();

describe('POST /tasks', () => {
  let createdUser: any;

  afterAll(async () => {
    // Disconnect Prisma
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a user for testing
    createdUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
      },
    });
  });

  afterEach(async () => {
    // Clean up the database
    if (createdUser) {
      await prisma.task.deleteMany({ where: { userId: createdUser.id } });
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  });

  it('should create a new task successfully with valid data', async () => {
    const res = await request('http://localhost:3000')
      .post('/tasks')
      .send({
        title: 'Test Task',
        description: 'Test Description',
        userId: createdUser.id,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Task');
    expect(res.body.description).toBe('Test Description');
    expect(res.body.userId).toBe(createdUser.id);
    expect(res.body.completed).toBe(false);

    const taskInDb = await prisma.task.findUnique({
      where: { id: res.body.id },
    });
    expect(taskInDb).not.toBeNull();
    expect(taskInDb?.title).toBe('Test Task');
  });

  it('should return a 404 error if the userId does not exist', async () => {
    const res = await request('http://localhost:3000')
      .post('/tasks')
      .send({
        title: 'Test Task',
        userId: 'non-existent-user-id',
      });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should return a 400 error if the title is missing', async () => {
    const res = await request('http://localhost:3000')
      .post('/tasks')
      .send({
        userId: createdUser.id,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Title cannot be empty');
  });

  it('should return a 400 error if the title is an empty string', async () => {
    const res = await request('http://localhost:3000')
      .post('/tasks')
      .send({
        title: '',
        userId: createdUser.id,
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Title cannot be empty');
  });

  it('should create a task successfully without a description', async () => {
    const res = await request('http://localhost:3000')
      .post('/tasks')
      .send({
        title: 'Test Task No Description',
        userId: createdUser.id,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Task No Description');
    expect(res.body.description).toBeFalsy();
    expect(res.body.userId).toBe(createdUser.id);

    const taskInDb = await prisma.task.findUnique({
      where: { id: res.body.id },
    });
    expect(taskInDb).not.toBeNull();
    expect(taskInDb?.description).toBeNull();
  });
});