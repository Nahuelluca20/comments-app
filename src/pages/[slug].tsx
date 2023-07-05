import type {GetStaticProps} from "next";

import {type NextPage} from "next";
import Head from "next/head";
import {createServerSideHelpers} from "@trpc/react-query/server";
import superjson from "superjson";
import Image from "next/image";

import {api} from "~/utils/api";
import {prisma} from "~/server/db";
import {appRouter} from "~/server/api/root";
import {PageLayout} from "~/components/layout";
import {LoadingPage} from "~/components/loading";
import {PostView} from "~/components/postview";

const ProfileFeed = (props: {userId: string}) => {
  const {data, isLoading} = api.posts.getPostsByUserId.useQuery({userId: props.userId});

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>User has no posted</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView key={fullPost.post.id} {...fullPost} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{username: string}> = ({username}) => {
  const {data} = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-48  bg-slate-600">
          <Image
            alt={`${data.username ?? ""}´s profile picture`}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black"
            height={128}
            src={data.profileImageUrl}
            width={128}
          />
        </div>
        <div className="h-[64px]" />
        <div className="p-4 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: {prisma, userId: null},
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({
    username,
  });

  return {
    props: {
      trcpState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
