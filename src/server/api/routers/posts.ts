import type {Post} from "@prisma/client";

import {clerkClient} from "@clerk/nextjs";
import {z} from "zod";
import {TRPCError} from "@trpc/server";
import {Ratelimit} from "@upstash/ratelimit"; // for deno: see above
import {Redis} from "@upstash/redis";

import {createTRPCRouter, privateProcedure, publicProcedure} from "~/server/api/trpc";
import {filterUserForClient} from "~/pages/api/helpers/filterUserClient";

const addUserDataToPost = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author || !author.username)
      throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Author for post not found"});

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
});

export const postRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ctx}) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return addUserDataToPost(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(({ctx, input}) =>
      ctx.prisma.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{createdAt: "desc"}],
        })
        .then(addUserDataToPost),
    ),

  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed").min(1).max(280),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const authorId = ctx.userId;

      const {success} = await ratelimit.limit(authorId);

      if (!success) throw new TRPCError({code: "TOO_MANY_REQUESTS", message: "Too many requests"});

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});
