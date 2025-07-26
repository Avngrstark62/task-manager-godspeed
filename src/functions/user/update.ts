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
        id: params.id,
      },
    });

    if (!userExists) {
      return new GSStatus(false, 404, undefined, { message: "User not found" });
    }

    const user = await prisma.client.user.update({
      where: {
        id: params.id,
      },
      data: {
        name: body.name,
        email: body.email,
      },
    });

    return new GSStatus(true, 200, undefined, user);
  } catch (error: any) {
    ctx.logger.error("Error updating user:", error);
    return new GSStatus(false, 500, undefined, {
      message: "An error occurred while updating the user",
      error: error.message,
    });
  }
}