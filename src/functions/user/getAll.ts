import { GSContext, GSDataSource, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const { datasources } = ctx;

    const prisma = datasources.schema;

    const users = await prisma.client.user.findMany();

    return new GSStatus(true, 200, undefined, users);
  } catch (error: any) {
    ctx.logger.error("Error getting all users:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while retrieving users",
      error: error.message,
    });
  }
}