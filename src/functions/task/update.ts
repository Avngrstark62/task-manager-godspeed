import { GSContext, GSDataSource, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const {
      inputs: {
        data: { params, body },
      },
      datasources,
    } = ctx;

    const prisma = datasources.schema;
    
    const userExists = await prisma.client.user.findUnique({
      where: {
        id: params.userId,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, {
        message: "User not found",
      });
    }

    const taskExists = await prisma.client.task.findUnique({
      where: {
        id: params.taskId,
      },
    });

    if (!taskExists) {
      return new GSStatus(false, 404, undefined, {
        message: "Task not found",
      });
    }

    // check if the user is authorized to update the task
    if (taskExists.userId !== params.userId) {
      return new GSStatus(false, 403, undefined, {
        message: "You are not authorized to update this task",
      });
    }
    
    const task = await prisma.client.task.update({
      where: {
        id: params.taskId,
      },
      data: {
        title: body.title,
        description: body.description,
        completed: body.completed,
      },
    });

    return new GSStatus(true, 200, undefined, task);
  } catch (error: any) {
    ctx.logger.error("Error updating task:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while updating the task",
      error: error.message,
    });
  }
}