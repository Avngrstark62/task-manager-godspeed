import { GSContext, GSStatus, GSCloudEvent, Logger } from '@godspeedsystems/core';
import create from '../../../src/functions/task/create';

// Mock the Prisma client
const mockPrisma = {
  client: {
    user: {
      findUnique: jest.fn(),
    },
    task: {
      create: jest.fn(),
    },
  },
};

// Fully mock the logger
const mockLogger: Logger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

// Helper to create a base mock context
const createMockCtx = (body: Record<string, any>): GSContext => ({
  inputs: {
    data: { body },
    // Fulfilling GSCloudEvent properties
    id: 'test-id',
    specversion: '1.0',
    type: 'test-type',
    source: 'test-source',
    subject: 'test-subject',
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    dataschema: 'test-schema',
  } as GSCloudEvent,
  datasources: {
    schema: mockPrisma,
  },
  logger: mockLogger,
});


// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('create task function', () => {
  // Test Case 1.1: should create a new task successfully when provided with valid data
  it('should create a new task successfully when provided with valid data', async () => {
    // Setup: Define a mock GSContext object
    const mockBody = {
      title: 'New Task',
      description: 'Task Description',
      userId: 'user-123',
    };
    const mockCtx = createMockCtx(mockBody);

    const user = { id: 'user-123', name: 'Test User' };
    const task = { id: 'task-123', ...mockBody };

    // Mock prisma calls
    mockPrisma.client.user.findUnique.mockResolvedValue(user);
    mockPrisma.client.task.create.mockResolvedValue(task);

    // Steps: Call the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    expect(mockPrisma.client.task.create).toHaveBeenCalledWith({ data: mockBody });
    expect(result).toBeInstanceOf(GSStatus);
    expect(result.isSuccess).toBe(true);
    expect(result.code).toBe(201);
    expect(result.data).toEqual(task);
  });

  // Test Case 2.1: should create a task successfully when only required fields are provided
  it('should create a task successfully when only required fields are provided', async () => {
    // Setup: Mock GSContext with only required fields
    const mockBody = {
      title: 'Required Only Task',
      userId: 'user-123',
    };
    const mockCtx = createMockCtx(mockBody);

    const user = { id: 'user-123', name: 'Test User' };
    const task = { id: 'task-456', ...mockBody, description: undefined };

    mockPrisma.client.user.findUnique.mockResolvedValue(user);
    mockPrisma.client.task.create.mockResolvedValue(task);

    // Steps: Invoke the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.task.create).toHaveBeenCalledWith({
      data: {
        ...mockBody,
        description: undefined,
      },
    });
    expect(result.isSuccess).toBe(true);
    expect(result.code).toBe(201);
    expect(result.data).toEqual(task);
  });

  // Test Case 2.2: should return a 400 error if the title is an empty string
  it('should return a 400 error if the title is an empty string', async () => {
    // Setup: Mock GSContext with an empty title
    const mockBody = {
      title: '',
      userId: 'user-123',
    };
    const mockCtx = createMockCtx(mockBody);

    // Steps: Call the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.client.task.create).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.code).toBe(400);
    expect(result.data.message).toBe('Title cannot be empty');
  });

  // Test Case 2.3: should return a 400 error if the title consists only of whitespace
  it('should return a 400 error if the title consists only of whitespace', async () => {
    // Setup: Mock GSContext with a whitespace title
    const mockBody = {
      title: '   ',
      userId: 'user-123',
    };
    const mockCtx = createMockCtx(mockBody);

    // Steps: Invoke the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.client.task.create).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.code).toBe(400);
    expect(result.data.message).toBe('Title cannot be empty');
  });

  // Test Case 3.1: should return a 404 error if the user does not exist
  it('should return a 404 error if the user does not exist', async () => {
    // Setup: Mock GSContext with a non-existent userId
    const mockBody = {
      title: 'Task for non-existent user',
      userId: 'user-404',
    };
    const mockCtx = createMockCtx(mockBody);

    mockPrisma.client.user.findUnique.mockResolvedValue(null);

    // Steps: Call the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-404' } });
    expect(mockPrisma.client.task.create).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.code).toBe(404);
    expect(result.data.message).toBe('User not found');
  });

  // Test Case 3.2: should return a 500 error if the database call to create a task fails
  it('should return a 500 error if the database call to create a task fails', async () => {
    // Setup: Mock GSContext with valid data but make prisma.create reject
    const mockBody = {
      title: 'DB Fail Task',
      description: 'This will fail',
      userId: 'user-123',
    };
    const mockCtx = createMockCtx(mockBody);

    const user = { id: 'user-123', name: 'Test User' };
    const dbError = new Error('DB connection failed');

    mockPrisma.client.user.findUnique.mockResolvedValue(user);
    mockPrisma.client.task.create.mockRejectedValue(dbError);

    // Steps: Call the create(ctx) function
    const result = await create(mockCtx);

    // Assertions
    expect(mockPrisma.client.user.findUnique).toHaveBeenCalled();
    expect(mockPrisma.client.task.create).toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.code).toBe(500);
    expect(result.data.message).toBe('An error occurred while creating the task');
    expect(mockLogger.error).toHaveBeenCalledWith('Error creating task:', dbError);
  });
});