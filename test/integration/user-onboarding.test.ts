import { PrismaClient } from '../../src/datasources/prisma-clients/schema';
import request from 'supertest';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000'; // Assuming the app runs on port 3000

describe('Feature: New User Onboarding & First Task Creation', () => {
  let createdUserId: string | null = null;
  let createdUserEmail: string | null = null;

  afterAll(async () => {
    // Cleanup created data
    if (createdUserId) {
      const user = await prisma.user.findUnique({ where: { id: createdUserId } });
      if (user) {
        await prisma.task.deleteMany({ where: { userId: createdUserId } });
        await prisma.user.delete({ where: { id: createdUserId } });
      }
    }
    if (createdUserEmail) {
        const user = await prisma.user.findUnique({ where: { email: createdUserEmail } });
        if (user) {
            await prisma.task.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
    }
    await prisma.$disconnect();
  });

  // Test Case 1: Happy Path
  test('should successfully register a new user and allow them to create their first task', async () => {
    // Step 1: Register a new user
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    const userResponse = await request(BASE_URL)
      .post('/users')
      .send({
        name: 'Test User',
        email: uniqueEmail,
      });

    // Assert user creation
    expect(userResponse.status).toBe(201);
    expect(userResponse.body.id).toBeDefined();
    expect(userResponse.body.name).toBe('Test User');
    expect(userResponse.body.email).toBe(uniqueEmail);

    createdUserId = userResponse.body.id; // Save for cleanup

    // Step 2: Create the first task for the new user
    const taskResponse = await request(BASE_URL)
      .post('/tasks')
      .send({
        title: 'Complete onboarding',
        description: 'Fill out profile information',
        userId: createdUserId,
      });

    // Assert task creation
    expect(taskResponse.status).toBe(201);
    expect(taskResponse.body.id).toBeDefined();
    expect(taskResponse.body.title).toBe('Complete onboarding');
    expect(taskResponse.body.userId).toBe(createdUserId);

    // Step 3: Verify in database
    if (!createdUserId) {
      throw new Error('createdUserId is null');
    }
    const dbUser = await prisma.user.findUnique({ where: { id: createdUserId } });
    const dbTask = await prisma.task.findFirst({ where: { userId: createdUserId } });

    expect(dbUser).not.toBeNull();
    expect(dbTask).not.toBeNull();
    expect(dbTask?.title).toBe('Complete onboarding');
  }, 10000); // 10 second timeout

  // Test Case 2: Failure Path - Task creation for a non-existent user
  test('should return 404 when trying to create a task for a non-existent user', async () => {
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000'; // A valid but non-existent UUID

    const response = await request(BASE_URL)
      .post('/tasks')
      .send({
        title: 'A task for a ghost',
        description: 'This should fail',
        userId: nonExistentUserId,
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found');
  });

  // Test Case 3: Failure Path - User registration with a duplicate email
  test('should return 400 when trying to register a user with a duplicate email', async () => {
    // Step 1: Create an initial user
    createdUserEmail = `duplicate-${Date.now()}@example.com`;
    const firstUserResponse = await request(BASE_URL)
      .post('/users')
      .send({
        name: 'Original User',
        email: createdUserEmail,
      });

    expect(firstUserResponse.status).toBe(201);

    // Step 2: Attempt to create another user with the same email
    const secondUserResponse = await request(BASE_URL)
      .post('/users')
      .send({
        name: 'Duplicate User',
        email: createdUserEmail,
      });

    expect(secondUserResponse.status).toBe(400);
    expect(secondUserResponse.body.message).toBe('A user with this email already exists');
  });
});