import {SignInButton, SignedIn, SignedOut, UserButton, useUser} from "@clerk/nextjs";
import {type NextPage} from "next";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {useState} from "react";
import toast from "react-hot-toast";

import {api} from "~/utils/api";
import LoadingSpiner, {LoadingPage} from "~/components/loading";
import {PageLayout} from "~/components/layout";
import {PostView} from "~/components/postview";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const [input, setInput] = useState<string>("");

  const {user} = useUser();

  const ctx = api.useContext();

  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;

      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <UserButton
        appearance={{
          elements: {avatarBox: "h-14 w-14 rounded-full"},
        }}
      />
      <input
        className="grow bg-transparent outline-none"
        disabled={isPosting}
        placeholder="Text some emojis!!"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && input !== "") {
            mutate({content: input});
          }
        }}
      />
      {input !== "" && !isPosting && (
        <button type="submit" onClick={() => mutate({content: input})}>
          Post
        </button>
      )}

      {isPosting ? (
        <div className="flex items-center justify-center">
          <LoadingSpiner size={20} />
        </div>
      ) : null}
    </div>
  );
};

const Feed = () => {
  const {data, isLoading: postLoading} = api.posts.getAll.useQuery();

  if (postLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div>
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const {isLoaded: userLoaded, isSignedIn} = useUser();

  //Start fetching asap
  api.posts.getAll.useQuery();

  if (!userLoaded || !isSignedIn)
    return (
      <SignedOut>
        <SignInButton />
      </SignedOut>
    );

  return (
    <PageLayout>
      <div className="flex border-b border-slate-600 p-4">
        <SignedIn>
          <CreatePostWizard />
        </SignedIn>
      </div>
      <Feed />
    </PageLayout>
  );
};

export default Home;
