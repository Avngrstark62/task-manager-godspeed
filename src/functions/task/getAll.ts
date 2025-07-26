import { GSContext, GSDataSource, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const {
      inputs: {
        data: { params },
      },
      datasources,
    } = ctx;

    const prisma = datasources.schema; // Corrected datasource name

    const userExists = await prisma.client.user.findUnique({
      where: {
        id: params.userId,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, {
        message: "User not found"
      });
    }

    const tasks = await prisma.client.task.findMany({
      where: {
        userId: params.userId,
      },
    });

    return new GSStatus(true, 200, undefined, tasks);
  } catch (error: any) {
    ctx.logger.error("Error getting all tasks:", error);
    return new GSStatus(false, 500, undefined,
      {
        message: "An error occurred while retrieving tasks",
        error: error.message
      }
    );
  }
}