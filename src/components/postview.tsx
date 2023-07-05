import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import relativeTime from "dayjs/plugin/relativeTime";

import type {RouterOutputs} from "~/utils/api";

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
dayjs.extend(relativeTime);

export const PostView = (props: PostWithUser) => {
  const {post, author} = props;

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Link href={`/@${author.username}`}>
        <Image
          alt={`@${author.username}'s profile picture`}
          className="h-14 w-14 rounded-full"
          height={56}
          src={author.profileImageUrl}
          width={56}
        />
      </Link>
      <div className="flex flex-col">
        <div className="flex gap-1 font-semibold text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{`· ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text- xl">{post.content}</span>
      </div>
    </div>
  );
};
