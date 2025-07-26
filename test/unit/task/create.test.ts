import { GSContext, GSStatus } from '@godspeedsystems/core';
import createTask from '../../../src/functions/task/create';

// Mock the datasources
const mockDatasources = {
  schema: {
    client: {
      user: {
        findUnique: jest.fn(),
      },
      task: {
        create: jest.fn(),
      },
    },
  },
};

// Mock the logger
const mockLogger = {
  error: jest.fn(),
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTask', () => {
  // Test Case 1.1: Happy Path - Successful Task Creation
  it('should create and return a new task with status 201 when a valid user ID is provided', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: 'New Task',
      description: 'Task description',
      userId: 'valid-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // This is the user that will be returned by the findUnique method
    const mockUser = {
      id: 'valid-user-id',
      name: 'Test User',
      email: 'test@example.com',
    };

    // This is the task that will be returned by the create method
    const mockTask = {
      id: 'task-id-1',
      ...mockBody,
    };

    // Mock the findUnique method to return the user
    mockDatasources.schema.client.user.findUnique.mockResolvedValue(mockUser);
    // Mock the create method to return the task
    mockDatasources.schema.client.task.create.mockResolvedValue(mockTask);

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was called with the correct arguments
    expect(mockDatasources.schema.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'valid-user-id' },
    });

    // Assert that the create method was called with the correct arguments
    expect(mockDatasources.schema.client.task.create).toHaveBeenCalledWith({
      data: mockBody,
    });

    // Assert that the result is a GSStatus object with success: true and code: 201
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is true
    expect(result.success).toBe(true);
    // Assert that the code property is 201
    expect(result.code).toBe(201);
    // Assert that the data property is the mock task
    expect(result.data).toEqual(mockTask);
  });

  // Test Case 2.1: User Not Found
  it('should return a 404 error if the user ID does not exist', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: 'Task for non-existent user',
      userId: 'non-existent-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // Mock the findUnique method to return null
    mockDatasources.schema.client.user.findUnique.mockResolvedValue(null);

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was called with the correct arguments
    expect(mockDatasources.schema.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'non-existent-user-id' },
    });

    // Assert that the create method was not called
    expect(mockDatasources.schema.client.task.create).not.toHaveBeenCalled();

    // Assert that the result is a GSStatus object with success: false and code: 404
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is false
    expect(result.success).toBe(false);
    // Assert that the code property is 404
    expect(result.code).toBe(404);
    // Assert that the data property has a message property with the correct value
    expect(result.data).toHaveProperty('message', 'User not found');
  });

  // Test Case 2.2: Database Error on User Lookup
  it('should return a 500 error if checking for user existence fails', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: 'Test Task',
      userId: 'any-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // This is the error that will be thrown by the findUnique method
    const dbError = new Error('Database connection failed');
    // Mock the findUnique method to throw an error
    mockDatasources.schema.client.user.findUnique.mockRejectedValue(dbError);

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was called with the correct arguments
    expect(mockDatasources.schema.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'any-user-id' },
    });

    // Assert that the logger's error method was called with the correct arguments
    expect(mockLogger.error).toHaveBeenCalledWith('Error creating task:', dbError);

    // Assert that the result is a GSStatus object with success: false and code: 500
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is false
    expect(result.success).toBe(false);
    // Assert that the code property is 500
    expect(result.code).toBe(500);
    // Assert that the data property has a message property with the correct value
    expect(result.data).toHaveProperty('message', 'An error occurred while creating the task');
  });

  // Test Case 2.3: Database Error on Task Creation
  it('should return a 500 error if task creation fails in the database', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: 'Test Task',
      userId: 'valid-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // This is the user that will be returned by the findUnique method
    const mockUser = {
      id: 'valid-user-id',
      name: 'Test User',
      email: 'test@example.com',
    };

    // This is the error that will be thrown by the create method
    const dbError = new Error('Failed to create task');
    // Mock the findUnique method to return the user
    mockDatasources.schema.client.user.findUnique.mockResolvedValue(mockUser);
    // Mock the create method to throw an error
    mockDatasources.schema.client.task.create.mockRejectedValue(dbError);

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was called with the correct arguments
    expect(mockDatasources.schema.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'valid-user-id' },
    });

    // Assert that the create method was called with the correct arguments
    expect(mockDatasources.schema.client.task.create).toHaveBeenCalledWith({
      data: mockBody,
    });

    // Assert that the logger's error method was called with the correct arguments
    expect(mockLogger.error).toHaveBeenCalledWith('Error creating task:', dbError);

    // Assert that the result is a GSStatus object with success: false and code: 500
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is false
    expect(result.success).toBe(false);
    // Assert that the code property is 500
    expect(result.code).toBe(500);
    // Assert that the data property has a message property with the correct value
    expect(result.data).toHaveProperty('message', 'An error occurred while creating the task');
  });

  // Test Case 3.1: Task Creation with Missing Optional Fields
  it('should successfully create a task when optional description is not provided', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: 'Task without description',
      userId: 'valid-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // This is the user that will be returned by the findUnique method
    const mockUser = {
      id: 'valid-user-id',
      name: 'Test User',
      email: 'test@example.com',
    };

    // This is the task that will be returned by the create method
    const mockTask = {
      id: 'task-id-2',
      ...mockBody,
      description: undefined,
    };

    // Mock the findUnique method to return the user
    mockDatasources.schema.client.user.findUnique.mockResolvedValue(mockUser);
    // Mock the create method to return the task
    mockDatasources.schema.client.task.create.mockResolvedValue(mockTask);

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was called with the correct arguments
    expect(mockDatasources.schema.client.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'valid-user-id' },
    });

    // Assert that the create method was called with the correct arguments
    expect(mockDatasources.schema.client.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Task without description',
        userId: 'valid-user-id',
        description: undefined,
      },
    });

    // Assert that the result is a GSStatus object with success: true and code: 201
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is true
    expect(result.success).toBe(true);
    // Assert that the code property is 201
    expect(result.code).toBe(201);
    // Assert that the data property is the mock task
    expect(result.data).toEqual(mockTask);
  });

  // Test Case 3.2: Invalid Input - Empty Title
  it('should return a 400 error if the title is empty or contains only whitespace', async () => {
    // This is the request body that will be used in the test
    const mockBody = {
      title: ' ',
      userId: 'valid-user-id',
    };

    // This is the mock context that will be passed to the function
    const mockCtx = {
      inputs: {
        data: {
          body: mockBody,
        },
      },
      datasources: mockDatasources,
      logger: mockLogger,
    } as unknown as GSContext;

    // Call the function with the mock context
    const result = await createTask(mockCtx);

    // Assert that the findUnique method was not called
    expect(mockDatasources.schema.client.user.findUnique).not.toHaveBeenCalled();
    // Assert that the create method was not called
    expect(mockDatasources.schema.client.task.create).not.toHaveBeenCalled();

    // Assert that the result is a GSStatus object with success: false and code: 400
    expect(result).toBeInstanceOf(GSStatus);
    // Assert that the success property is false
    expect(result.success).toBe(false);
    // Assert that the code property is 400
    expect(result.code).toBe(400);
    // Assert that the data property has a message property with the correct value
    expect(result.data).toHaveProperty('message', 'Title cannot be empty');
  });
});