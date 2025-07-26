import { GSContext, GSStatus } from "@godspeedsystems/core";

export default async function (ctx: GSContext) {
  try {
    const {
      inputs: {
        data: { body },
      },
      datasources,
    } = ctx;

    const prisma = datasources.schema;

    const userExists = await prisma.client.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (userExists) {
      return new GSStatus(false, 400, undefined, {message: "A user with this email already exists"});
    }


    const user = await prisma.client.user.create({
      data: {
        name: body.name,
        email: body.email,
      },
    });

    return new GSStatus(true, 201, undefined, user);
  } catch (error: any) {
    ctx.logger.error("Error creating user:", error);
    return new GSStatus(false, 500, undefined, {message: "An error occurred while creating the user", error: error.message});
  }
}